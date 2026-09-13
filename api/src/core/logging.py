import logging
import json
import uuid
import datetime
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

import time

# Context variable to hold the request ID and user ID
request_id_context = ContextVar("request_id", default=None)
user_id_context = ContextVar("user_id", default=None)

import re

# Regex patterns for sensitive data
SENSITIVE_PATTERNS = [
    (re.compile(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'), '[REDACTED_JWT]'),
    (re.compile(r'-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----', re.DOTALL), '[REDACTED_RSA_KEY]'),
    (re.compile(r'(?i)(password|secret|api_key|access_token)[\"\'\s]*[:=][\"\'\s]*([^\s\"\',]+)'), r'\1: [REDACTED]')
]

def sanitize_string(text: str) -> str:
    if not isinstance(text, str):
        return text
    for pattern, replacement in SENSITIVE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text

def sanitize_dict(d: dict) -> dict:
    if not isinstance(d, dict):
        return d
    sanitized = {}
    for k, v in d.items():
        if isinstance(v, str):
            sanitized[k] = sanitize_string(v)
        elif isinstance(v, dict):
            sanitized[k] = sanitize_dict(v)
        elif isinstance(v, list):
            sanitized[k] = [sanitize_string(item) if isinstance(item, str) else item for item in v]
        else:
            sanitized[k] = v
    return sanitized

class JsonFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the LogRecord.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.datetime.fromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": sanitize_string(record.getMessage()),
        }
        
        # Include request ID if available
        req_id = request_id_context.get()
        if req_id:
            log_obj["trace_id"] = req_id
            
        # Include user ID if available
        usr_id = user_id_context.get()
        if usr_id:
            log_obj["actor_id"] = usr_id

        # Include structured context if passed via extra
        if hasattr(record, "event"):
            log_obj["operation"] = record.event
        if hasattr(record, "user_id") and not usr_id:
            log_obj["actor_id"] = record.user_id
        if hasattr(record, "business_owner_id"):
            log_obj["tenant_id"] = record.business_owner_id
        if hasattr(record, "resource_type"):
            log_obj["resource_type"] = record.resource_type
        if hasattr(record, "resource_id"):
            log_obj["resource_id"] = record.resource_id
        if hasattr(record, "state_before"):
            log_obj["state_before"] = record.state_before
        if hasattr(record, "state_after"):
            log_obj["state_after"] = record.state_after
        if hasattr(record, "outcome"):
            log_obj["outcome"] = record.outcome
            
        # Allow-list only approved payload keys if provided
        if hasattr(record, "payload") and isinstance(record.payload, dict):
            allowed_payload_keys = getattr(record, "allowed_payload_keys", [])
            filtered_payload = {k: v for k, v in record.payload.items() if k in allowed_payload_keys}
            log_obj["payload"] = sanitize_dict(filtered_payload)
            
        # Optional fields from our custom request completion log
        if hasattr(record, "method"):
            log_obj["method"] = record.method
        if hasattr(record, "path"):
            log_obj["path"] = record.path
        if hasattr(record, "route_template"):
            log_obj["route_template"] = record.route_template
        if hasattr(record, "status_code"):
            log_obj["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_obj["duration_ms"] = record.duration_ms

        if record.exc_info:
            log_obj["exception"] = sanitize_string(self.formatException(record.exc_info))

        return json.dumps(log_obj)

def setup_logging(log_level: str = "INFO"):
    logger = logging.getLogger()
    logger.setLevel(log_level)

    # Remove all existing handlers (like default uvicorn handlers)
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Add our custom JSON handler
    json_handler = logging.StreamHandler()
    json_handler.setFormatter(JsonFormatter())
    logger.addHandler(json_handler)

    # Force uvicorn and fastapi to use our logger
    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        l = logging.getLogger(logger_name)
        l.handlers = []
        l.propagate = True

middleware_logger = logging.getLogger("api.request")

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate a unique request ID
        req_id = str(uuid.uuid4())
        
        # Set the context variable
        token_req = request_id_context.set(req_id)
        # Reset user_id at the start of a request
        token_usr = user_id_context.set(None)
        
        start_time = time.time()
        
        try:
            # Proceed with the request
            response = await call_next(request)
            # Add the request ID to the response headers
            response.headers["X-Request-ID"] = req_id
            
            # Add Pilot Safety Header if in pilot mode
            from src.config import settings
            if settings.DEPLOYMENT_MODE == "pilot":
                response.headers["X-Pilot-Mode"] = "true"
            
            # Try to get route template
            route_template = None
            if "route" in request.scope:
                route_template = getattr(request.scope["route"], "path", None)
                
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            middleware_logger.info(
                f"{request.method} {request.url.path} - {response.status_code}",
                extra={
                    "event": "request_completed",
                    "method": request.method,
                    "path": request.url.path,
                    "route_template": route_template or request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms
                }
            )
            
            return response
        finally:
            # Reset the context variable
            request_id_context.reset(token_req)
            user_id_context.reset(token_usr)

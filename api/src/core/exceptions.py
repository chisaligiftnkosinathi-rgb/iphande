import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from src.core.logging import request_id_context

logger = logging.getLogger(__name__)

def _get_error_content(detail: any) -> dict:
    content = {"detail": detail}
    req_id = request_id_context.get()
    if req_id:
        content["support_trace_id"] = req_id
    return content

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for 500 internal server errors.
    Logs the exception with traceback internally but returns a safe generic message to the client.
    """
    logger.exception("Unhandled exception occurred", extra={"event": "internal_server_error"})
    return JSONResponse(
        status_code=500,
        content=_get_error_content("Internal Server Error")
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Catches Database-level errors.
    """
    logger.exception("Database error occurred", extra={"event": "database_error"})
    return JSONResponse(
        status_code=500,
        content=_get_error_content("Internal Server Error")
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Standardizes 422 Request Validation errors.
    """
    logger.warning("Request validation failed", extra={"event": "validation_failed"})
    # Keep the default FastAPI validation error structure for the client, but log it properly
    return JSONResponse(
        status_code=422,
        content=_get_error_content(exc.errors())
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Catches 4xx errors thrown as HTTPExceptions.
    """
    if exc.status_code >= 500:
        logger.error(f"HTTP exception: {exc.detail}", extra={"event": "http_error_5xx"})
    elif exc.status_code == 401 or exc.status_code == 403:
        logger.warning(f"Unauthorized/Forbidden access: {exc.detail}", extra={"event": "unauthorized_access", "ip": request.client.host if request.client else None})
    else:
        logger.info(f"HTTP exception: {exc.detail}", extra={"event": "http_error_4xx"})
        
    # Standardize auth messages
    client_detail = exc.detail
    if exc.status_code == 401:
        client_detail = "Authentication required or invalid credentials."
    elif exc.status_code == 403:
        client_detail = "You do not have permission to perform this action."
        
    return JSONResponse(
        status_code=exc.status_code,
        content=_get_error_content(client_detail)
    )

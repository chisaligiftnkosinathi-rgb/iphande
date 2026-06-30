from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from src.core.logging import request_id_context

limiter = Limiter(key_func=get_remote_address)

async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    content = {
        "detail": "You're doing this too fast. Please wait a few seconds and try again."
    }
    
    req_id = request_id_context.get()
    if req_id:
        content["support_trace_id"] = req_id
        
    headers = {}
    if hasattr(exc, "headers") and exc.headers:
        headers = exc.headers
        if "Retry-After" in headers:
            content["retry_after_seconds"] = int(headers["Retry-After"])
            
    return JSONResponse(
        status_code=429,
        content=content,
        headers=headers
    )

def setup_rate_limiting(app: FastAPI):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.cors import CORSSecurityHeaders, log_cors_request
from app.api.v1.router import api_router
import logging
from typing import Callable

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Get CORS configuration based on environment
cors_config = settings.get_cors_config()

# CORS 미들웨어 - Using secure configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
    expose_headers=cors_config.get("expose_headers", []),
    max_age=cors_config.get("max_age", 3600),
)


# Custom middleware for CORS logging and security headers
@app.middleware("http")
async def add_security_headers_and_log_cors(request: Request, call_next: Callable) -> Response:
    """
    Add security headers and log CORS requests
    Reference: OWASP Secure Headers Project
    """
    # Log CORS requests if enabled
    if settings.ENABLE_CORS_LOGGING:
        origin = request.headers.get("origin", "no-origin")
        method = request.method
        path = request.url.path

        # Check if this is a CORS request
        if origin != "no-origin":
            # Determine if origin is allowed
            allowed = origin in cors_config["allow_origins"]
            log_cors_request(origin, method, path, allowed)

    # Process the request
    response = await call_next(request)

    # Add security headers if enabled
    if settings.ENABLE_SECURITY_HEADERS:
        security_headers = CORSSecurityHeaders.get_security_headers(settings.ENVIRONMENT)
        for header, value in security_headers.items():
            response.headers[header] = value

    # Add request ID for tracing
    request_id = request.headers.get("X-Request-ID", "")
    if request_id:
        response.headers["X-Request-ID"] = request_id

    return response


# Handle CORS preflight requests explicitly
@app.options("/{full_path:path}")
async def preflight_handler(request: Request, full_path: str) -> Response:
    """
    Handle OPTIONS preflight requests
    This ensures proper CORS headers are set for preflight requests
    """
    origin = request.headers.get("origin", "")

    # Check if origin is allowed
    if origin in cors_config["allow_origins"]:
        logger.debug(f"Preflight request allowed for origin: {origin}, path: /{full_path}")
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": ", ".join(cors_config["allow_methods"]),
                "Access-Control-Allow-Headers": ", ".join(cors_config["allow_headers"]),
                "Access-Control-Allow-Credentials": str(cors_config["allow_credentials"]).lower(),
                "Access-Control-Max-Age": str(cors_config["max_age"])
            }
        )
    else:
        logger.warning(f"Preflight request blocked for origin: {origin}, path: /{full_path}")
        return JSONResponse(
            status_code=403,
            content={
                "error": "CORS_ERROR",
                "message": "Origin not allowed",
                "origin": origin
            }
        )

# 라우터 등록
app.include_router(api_router, prefix="/api/v1")


# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root
@app.get("/")
async def root():
    return {
        "message": "PoliticianFinder API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

"""
Security Middleware for SQL Injection and Attack Prevention
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Optional
import time
import re
from collections import defaultdict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent brute force SQL injection attempts
    """

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address)
        client_ip = self._get_client_ip(request)

        # Check rate limit
        if self._is_rate_limited(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Too many requests",
                    "message": f"Rate limit exceeded. Max {self.max_requests} requests per {self.window_seconds} seconds."
                }
            )

        # Record request
        self._record_request(client_ip)

        # Clean old records periodically
        self._cleanup_old_requests()

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for proxy headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if client has exceeded rate limit"""
        now = time.time()
        cutoff = now - self.window_seconds

        # Get recent requests from this IP
        recent_requests = [
            req_time for req_time in self.requests[client_ip]
            if req_time > cutoff
        ]

        return len(recent_requests) >= self.max_requests

    def _record_request(self, client_ip: str):
        """Record a request from client"""
        self.requests[client_ip].append(time.time())

    def _cleanup_old_requests(self):
        """Remove old request records to prevent memory leak"""
        now = time.time()
        cutoff = now - (self.window_seconds * 2)  # Keep 2x window for safety

        for client_ip in list(self.requests.keys()):
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if req_time > cutoff
            ]

            # Remove empty entries
            if not self.requests[client_ip]:
                del self.requests[client_ip]


class SQLInjectionDetectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to detect and block SQL injection attempts in requests
    """

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        # Classic SQL injection
        r"('|(--)|;|\/\*|\*\/)",
        # UNION attacks
        r"\b(UNION)\b.*\b(SELECT)\b",
        # Boolean-based blind
        r"(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+",
        # Time-based blind
        r"\b(SLEEP|WAITFOR|DELAY|BENCHMARK)\b",
        # Stacked queries
        r";.*\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE)\b",
        # Comment-based
        r"(--|\#|\/\*|\*\/)\s*$",
        # Hexadecimal encoding
        r"0x[0-9a-f]+",
        # Common SQL keywords
        r"\b(EXEC|EXECUTE|XP_CMDSHELL|SP_)\b",
    ]

    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
        self.compiled_patterns = [
            re.compile(pattern, re.IGNORECASE)
            for pattern in self.SQL_INJECTION_PATTERNS
        ]

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        # Check URL parameters
        if request.url.query:
            if self._contains_sql_injection(request.url.query):
                logger.warning(
                    f"SQL injection attempt in URL: {request.url} from {request.client.host}"
                )
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "Invalid request parameters"}
                )

        # Check path parameters
        if self._contains_sql_injection(str(request.url.path)):
            logger.warning(
                f"SQL injection attempt in path: {request.url.path} from {request.client.host}"
            )
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Invalid request path"}
            )

        # For POST/PUT requests, we'll rely on Pydantic validation
        # This middleware is a defense-in-depth layer

        response = await call_next(request)
        return response

    def _contains_sql_injection(self, text: str) -> bool:
        """Check if text contains SQL injection patterns"""
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                return True
        return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    """

    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Add security headers
        for header, value in self.SECURITY_HEADERS.items():
            response.headers[header] = value

        return response


class RequestSizeLimit(BaseHTTPMiddleware):
    """
    Limit request body size to prevent DoS attacks
    """

    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        # Check Content-Length header
        content_length = request.headers.get("content-length")

        if content_length:
            content_length = int(content_length)
            if content_length > self.max_size:
                logger.warning(
                    f"Request body too large: {content_length} bytes from {request.client.host}"
                )
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "error": "Request body too large",
                        "max_size": self.max_size
                    }
                )

        response = await call_next(request)
        return response


class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Log all database-related requests for security auditing
    """

    def __init__(self, app, log_file: Optional[str] = None):
        super().__init__(app)
        self.log_file = log_file

        # Setup dedicated audit logger
        self.audit_logger = logging.getLogger("security.audit")
        if log_file:
            handler = logging.FileHandler(log_file)
            handler.setFormatter(
                logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
            )
            self.audit_logger.addHandler(handler)

    async def dispatch(self, request: Request, call_next):
        # Log request details
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": str(request.url.path),
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
        }

        # Only log query parameters for GET requests (avoid logging sensitive POST data)
        if request.method == "GET" and request.url.query:
            log_entry["query_params"] = str(request.url.query)

        # Process request
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        # Add response info
        log_entry["status_code"] = response.status_code
        log_entry["duration_ms"] = round(duration * 1000, 2)

        # Log with appropriate level based on status code
        if response.status_code >= 500:
            self.audit_logger.error(log_entry)
        elif response.status_code >= 400:
            self.audit_logger.warning(log_entry)
        else:
            self.audit_logger.info(log_entry)

        return response


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Optional: Restrict database admin endpoints to whitelisted IPs
    """

    def __init__(self, app, whitelist: Optional[list] = None, protected_paths: Optional[list] = None):
        super().__init__(app)
        self.whitelist = set(whitelist or [])
        self.protected_paths = protected_paths or ["/admin", "/internal"]

    async def dispatch(self, request: Request, call_next):
        # Check if path is protected
        is_protected = any(
            str(request.url.path).startswith(path)
            for path in self.protected_paths
        )

        if is_protected:
            client_ip = self._get_client_ip(request)

            if client_ip not in self.whitelist:
                logger.warning(
                    f"Unauthorized access attempt to {request.url.path} from {client_ip}"
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Access denied"}
                )

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"


def setup_security_middleware(app, config: Optional[Dict] = None):
    """
    Setup all security middleware

    Usage:
        from app.middleware.security import setup_security_middleware

        app = FastAPI()
        setup_security_middleware(app, {
            'rate_limit': {'max_requests': 100, 'window_seconds': 60},
            'request_size_limit': {'max_size': 10 * 1024 * 1024},
            'audit_log': {'log_file': 'logs/security_audit.log'}
        })
    """
    config = config or {}

    # Add security headers (always enabled)
    app.add_middleware(SecurityHeadersMiddleware)

    # Add request size limit
    size_config = config.get('request_size_limit', {})
    app.add_middleware(RequestSizeLimit, **size_config)

    # Add rate limiting
    rate_config = config.get('rate_limit', {})
    app.add_middleware(RateLimitMiddleware, **rate_config)

    # Add SQL injection detection
    sql_config = config.get('sql_injection_detection', {'enabled': True})
    app.add_middleware(SQLInjectionDetectionMiddleware, **sql_config)

    # Add audit logging
    audit_config = config.get('audit_log', {})
    app.add_middleware(AuditLogMiddleware, **audit_config)

    # Optional: IP whitelist for admin endpoints
    if 'ip_whitelist' in config:
        app.add_middleware(IPWhitelistMiddleware, **config['ip_whitelist'])

    logger.info("Security middleware configured successfully")

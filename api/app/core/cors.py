"""
CORS Configuration Module
Implements secure CORS settings with environment-specific configurations
Following OWASP guidelines for CORS security
"""

from typing import List, Dict, Any
from enum import Enum
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class Environment(Enum):
    """Environment types for CORS configuration"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class CORSConfig:
    """
    Centralized CORS configuration with security best practices
    Reference: OWASP CORS Security Cheat Sheet
    """

    # Environment-specific allowed origins
    ALLOWED_ORIGINS: Dict[Environment, List[str]] = {
        Environment.DEVELOPMENT: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001"
        ],
        Environment.STAGING: [
            "https://staging.politicianfinder.vercel.app",
            "https://politician-finder-staging.vercel.app"
        ],
        Environment.PRODUCTION: [
            "https://politicianfinder.vercel.app",
            "https://www.politicianfinder.com",  # Custom domain when configured
            "https://politicianfinder.com"
        ]
    }

    # Explicitly allowed HTTP methods (no wildcards in production)
    ALLOWED_METHODS: List[str] = [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
        "PATCH"
    ]

    # Explicitly allowed headers (no wildcards in production)
    ALLOWED_HEADERS: List[str] = [
        "Accept",
        "Accept-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "X-Request-ID"
    ]

    # Headers that the browser is allowed to access
    EXPOSE_HEADERS: List[str] = [
        "Content-Type",
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset"
    ]

    # Preflight cache duration (in seconds)
    MAX_AGE: int = 3600  # 1 hour for production, can be shorter for development

    # Allow credentials (cookies, authorization headers)
    ALLOW_CREDENTIALS: bool = True

    @classmethod
    def get_origins_for_environment(cls, environment: str) -> List[str]:
        """
        Get allowed origins based on environment

        Args:
            environment: Current environment string

        Returns:
            List of allowed origins
        """
        try:
            env = Environment(environment.lower())
        except ValueError:
            logger.warning(f"Unknown environment: {environment}, defaulting to development")
            env = Environment.DEVELOPMENT

        return cls.ALLOWED_ORIGINS.get(env, cls.ALLOWED_ORIGINS[Environment.DEVELOPMENT])

    @classmethod
    def is_origin_allowed(cls, origin: str, environment: str) -> bool:
        """
        Check if an origin is allowed for the current environment

        Args:
            origin: Origin to check
            environment: Current environment

        Returns:
            True if origin is allowed, False otherwise
        """
        if not origin:
            return False

        allowed_origins = cls.get_origins_for_environment(environment)

        # Exact match check
        if origin in allowed_origins:
            return True

        # Parse and check with normalized URLs
        try:
            parsed = urlparse(origin)
            normalized = f"{parsed.scheme}://{parsed.netloc}"
            return normalized in allowed_origins
        except Exception as e:
            logger.error(f"Error parsing origin {origin}: {e}")
            return False

    @classmethod
    def get_cors_config(cls, environment: str) -> Dict[str, Any]:
        """
        Get complete CORS configuration for FastAPI CORSMiddleware

        Args:
            environment: Current environment

        Returns:
            Dictionary with CORS configuration
        """
        is_production = environment.lower() == "production"

        config = {
            "allow_origins": cls.get_origins_for_environment(environment),
            "allow_credentials": cls.ALLOW_CREDENTIALS,
            "allow_methods": cls.ALLOWED_METHODS if is_production else ["*"],
            "allow_headers": cls.ALLOWED_HEADERS if is_production else ["*"],
            "expose_headers": cls.EXPOSE_HEADERS,
            "max_age": cls.MAX_AGE
        }

        # Log configuration for debugging
        logger.info(f"CORS Configuration for {environment}:")
        logger.info(f"  Allowed Origins: {config['allow_origins']}")
        logger.info(f"  Allow Credentials: {config['allow_credentials']}")
        logger.info(f"  Production Mode: {is_production}")

        return config

    @classmethod
    def validate_origin_url(cls, origin: str) -> bool:
        """
        Validate origin URL format and security

        Args:
            origin: Origin URL to validate

        Returns:
            True if valid and secure, False otherwise
        """
        if not origin:
            return False

        try:
            parsed = urlparse(origin)

            # Check for valid scheme
            if parsed.scheme not in ['http', 'https']:
                logger.warning(f"Invalid scheme in origin: {origin}")
                return False

            # In production, only allow HTTPS
            if Environment.PRODUCTION.value in origin and parsed.scheme != 'https':
                logger.warning(f"HTTP not allowed in production origin: {origin}")
                return False

            # Check for valid netloc
            if not parsed.netloc:
                logger.warning(f"Missing netloc in origin: {origin}")
                return False

            # Prevent wildcard domains
            if '*' in parsed.netloc:
                logger.warning(f"Wildcard not allowed in origin: {origin}")
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating origin {origin}: {e}")
            return False


class CORSSecurityHeaders:
    """
    Additional security headers to complement CORS
    Reference: OWASP Secure Headers Project
    """

    @staticmethod
    def get_security_headers(environment: str) -> Dict[str, str]:
        """
        Get security headers based on environment

        Args:
            environment: Current environment

        Returns:
            Dictionary of security headers
        """
        is_production = environment.lower() == "production"

        headers = {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",

            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",

            # Enable XSS filter
            "X-XSS-Protection": "1; mode=block",

            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",

            # Permissions policy (formerly Feature Policy)
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }

        # Add strict CSP in production
        if is_production:
            headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.vercel-insights.com; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.politicianfinder.com https://*.supabase.co; "
                "frame-ancestors 'none';"
            )

            # HTTP Strict Transport Security
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return headers


def log_cors_request(origin: str, method: str, path: str, allowed: bool):
    """
    Log CORS request for monitoring and debugging

    Args:
        origin: Request origin
        method: HTTP method
        path: Request path
        allowed: Whether the request was allowed
    """
    log_level = logging.INFO if allowed else logging.WARNING
    logger.log(
        log_level,
        f"CORS Request - Origin: {origin}, Method: {method}, Path: {path}, Allowed: {allowed}"
    )


def create_cors_error_response(origin: str, reason: str) -> Dict[str, Any]:
    """
    Create a standardized CORS error response

    Args:
        origin: Rejected origin
        reason: Reason for rejection

    Returns:
        Error response dictionary
    """
    return {
        "error": "CORS_ERROR",
        "message": "Cross-Origin Request Blocked",
        "detail": f"Origin {origin} is not allowed",
        "reason": reason,
        "status_code": 403
    }
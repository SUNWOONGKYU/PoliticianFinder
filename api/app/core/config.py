from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Dict, Any
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "PoliticianFinder"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS - Legacy support (will be deprecated)
    CORS_ORIGINS: str = "http://localhost:3000"
    CORS_CREDENTIALS: bool = True

    # CORS - New environment-specific settings
    CORS_ALLOWED_ORIGINS: Optional[str] = None  # Override default origins if set
    CORS_MAX_AGE: int = 3600  # Preflight cache duration
    CORS_ALLOW_WILDCARDS: bool = False  # Only for development

    # Security Headers
    ENABLE_SECURITY_HEADERS: bool = True
    CSP_REPORT_URI: Optional[str] = None  # Content Security Policy reporting endpoint

    # API Keys
    CLAUDE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""  # Alias for CLAUDE_API_KEY
    OPENAI_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    # File Upload
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,gif"

    # Monitoring
    ENABLE_CORS_LOGGING: bool = True
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Legacy method for backward compatibility"""
        if self.CORS_ALLOWED_ORIGINS:
            return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == "development"

    @property
    def is_staging(self) -> bool:
        """Check if running in staging environment"""
        return self.ENVIRONMENT.lower() == "staging"

    def get_cors_config(self) -> Dict[str, Any]:
        """
        Get CORS configuration based on environment
        Uses the new CORSConfig class for secure settings
        """
        from app.core.cors import CORSConfig

        # Use custom origins if provided, otherwise use environment defaults
        if self.CORS_ALLOWED_ORIGINS:
            logger.info(f"Using custom CORS origins: {self.CORS_ALLOWED_ORIGINS}")
            return {
                "allow_origins": self.cors_origins_list,
                "allow_credentials": self.CORS_CREDENTIALS,
                "allow_methods": ["*"] if self.is_development else CORSConfig.ALLOWED_METHODS,
                "allow_headers": ["*"] if self.is_development else CORSConfig.ALLOWED_HEADERS,
                "expose_headers": CORSConfig.EXPOSE_HEADERS,
                "max_age": self.CORS_MAX_AGE
            }

        # Use environment-based configuration
        return CORSConfig.get_cors_config(self.ENVIRONMENT)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
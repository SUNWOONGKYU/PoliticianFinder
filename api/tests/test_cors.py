"""
CORS Security Tests
Tests CORS configuration and security measures
Reference: OWASP Testing Guide v4 - CORS Testing
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.cors import CORSConfig


class TestCORSConfiguration:
    """Test CORS configuration and security"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_cors_allowed_origin_get_request(self, client):
        """Test GET request from allowed origin"""
        allowed_origin = "http://localhost:3000"

        response = client.get(
            "/health",
            headers={"Origin": allowed_origin}
        )

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == allowed_origin
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_cors_allowed_origin_post_request(self, client):
        """Test POST request from allowed origin"""
        allowed_origin = "http://localhost:3000"

        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "password"},
            headers={"Origin": allowed_origin}
        )

        # May return 401/400, but should have CORS headers
        assert response.headers.get("access-control-allow-origin") == allowed_origin

    def test_cors_preflight_request(self, client):
        """Test OPTIONS preflight request"""
        allowed_origin = "http://localhost:3000"

        response = client.options(
            "/api/v1/politicians",
            headers={
                "Origin": allowed_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            }
        )

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == allowed_origin
        assert "POST" in response.headers.get("access-control-allow-methods", "")
        assert "Content-Type" in response.headers.get("access-control-allow-headers", "")
        assert response.headers.get("access-control-max-age") is not None

    def test_cors_disallowed_origin(self, client):
        """Test request from disallowed origin"""
        disallowed_origin = "https://malicious-site.com"

        response = client.options(
            "/api/v1/politicians",
            headers={"Origin": disallowed_origin}
        )

        assert response.status_code == 403
        assert response.json()["error"] == "CORS_ERROR"

    def test_cors_no_origin_header(self, client):
        """Test request without origin header (same-origin)"""
        response = client.get("/health")

        assert response.status_code == 200
        # No CORS headers should be present for same-origin requests

    def test_cors_credentials_enabled(self, client):
        """Test that credentials are enabled"""
        allowed_origin = "http://localhost:3000"

        response = client.get(
            "/health",
            headers={"Origin": allowed_origin}
        )

        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_cors_wildcard_not_used_with_credentials(self, client):
        """Test that wildcard origin is not used with credentials (security issue)"""
        allowed_origin = "http://localhost:3000"

        response = client.get(
            "/health",
            headers={"Origin": allowed_origin}
        )

        # Should not have wildcard when credentials are enabled
        assert response.headers.get("access-control-allow-origin") != "*"

    def test_security_headers_present(self, client):
        """Test that security headers are present"""
        response = client.get("/health")

        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-xss-protection") == "1; mode=block"
        assert response.headers.get("referrer-policy") is not None

    def test_exposed_headers(self, client):
        """Test that appropriate headers are exposed"""
        allowed_origin = "http://localhost:3000"

        response = client.get(
            "/health",
            headers={"Origin": allowed_origin}
        )

        expose_headers = response.headers.get("access-control-expose-headers", "")
        assert "Content-Type" in expose_headers
        assert "X-Request-ID" in expose_headers


class TestCORSConfigClass:
    """Test CORSConfig utility class"""

    def test_get_origins_for_development(self):
        """Test getting origins for development environment"""
        origins = CORSConfig.get_origins_for_environment("development")

        assert "http://localhost:3000" in origins
        assert "http://localhost:3001" in origins
        assert all(origin.startswith("http://") for origin in origins)

    def test_get_origins_for_production(self):
        """Test getting origins for production environment"""
        origins = CORSConfig.get_origins_for_environment("production")

        assert all(origin.startswith("https://") for origin in origins)
        assert any("vercel.app" in origin for origin in origins)

    def test_is_origin_allowed_valid(self):
        """Test origin validation for allowed origin"""
        assert CORSConfig.is_origin_allowed("http://localhost:3000", "development")

    def test_is_origin_allowed_invalid(self):
        """Test origin validation for disallowed origin"""
        assert not CORSConfig.is_origin_allowed("https://malicious.com", "development")

    def test_validate_origin_url_valid(self):
        """Test origin URL validation for valid URLs"""
        assert CORSConfig.validate_origin_url("http://localhost:3000")
        assert CORSConfig.validate_origin_url("https://politicianfinder.vercel.app")

    def test_validate_origin_url_invalid_scheme(self):
        """Test origin URL validation rejects invalid schemes"""
        assert not CORSConfig.validate_origin_url("ftp://localhost:3000")
        assert not CORSConfig.validate_origin_url("javascript://alert(1)")

    def test_validate_origin_url_wildcard(self):
        """Test origin URL validation rejects wildcards"""
        assert not CORSConfig.validate_origin_url("https://*.example.com")
        assert not CORSConfig.validate_origin_url("http://*")

    def test_validate_origin_url_empty(self):
        """Test origin URL validation rejects empty values"""
        assert not CORSConfig.validate_origin_url("")
        assert not CORSConfig.validate_origin_url(None)


class TestCORSSecurityVulnerabilities:
    """Test for common CORS security vulnerabilities"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_no_reflected_origin(self, client):
        """Test that origin is not blindly reflected (OWASP CORS #1)"""
        malicious_origin = "https://attacker.com"

        response = client.get(
            "/health",
            headers={"Origin": malicious_origin}
        )

        # Should not reflect the malicious origin
        cors_origin = response.headers.get("access-control-allow-origin")
        if cors_origin:
            assert cors_origin != malicious_origin

    def test_no_null_origin(self, client):
        """Test that null origin is not allowed (OWASP CORS #2)"""
        response = client.options(
            "/api/v1/politicians",
            headers={"Origin": "null"}
        )

        # Should reject null origin
        assert response.status_code == 403 or response.headers.get("access-control-allow-origin") != "null"

    def test_subdomain_not_automatically_allowed(self, client):
        """Test that subdomains are not automatically trusted"""
        subdomain_origin = "https://evil.politicianfinder.vercel.app"

        response = client.options(
            "/api/v1/politicians",
            headers={"Origin": subdomain_origin}
        )

        # Should only allow explicitly configured subdomains
        cors_origin = response.headers.get("access-control-allow-origin")
        if cors_origin:
            # Only allow if explicitly in allowed list
            assert cors_origin in CORSConfig.get_origins_for_environment(settings.ENVIRONMENT)

    def test_credentials_with_specific_origin(self, client):
        """Test that credentials require specific origin (not wildcard)"""
        allowed_origin = "http://localhost:3000"

        response = client.get(
            "/health",
            headers={"Origin": allowed_origin}
        )

        credentials = response.headers.get("access-control-allow-credentials")
        cors_origin = response.headers.get("access-control-allow-origin")

        # If credentials are true, origin must not be wildcard
        if credentials == "true":
            assert cors_origin != "*"

    def test_methods_explicitly_listed(self, client):
        """Test that methods are explicitly listed (not wildcard in production)"""
        allowed_origin = "http://localhost:3000"

        response = client.options(
            "/api/v1/politicians",
            headers={"Origin": allowed_origin}
        )

        methods = response.headers.get("access-control-allow-methods", "")

        # In production, should not use wildcard
        if settings.ENVIRONMENT.lower() == "production":
            assert methods != "*"
            assert "GET" in methods or "POST" in methods


@pytest.mark.integration
class TestCORSIntegration:
    """Integration tests for CORS with actual endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_cors_with_authentication(self, client):
        """Test CORS with authenticated requests"""
        allowed_origin = "http://localhost:3000"

        # This will likely return 401, but CORS headers should be present
        response = client.get(
            "/api/v1/politicians",
            headers={
                "Origin": allowed_origin,
                "Authorization": "Bearer invalid-token"
            }
        )

        # CORS headers should be present even for failed auth
        assert response.headers.get("access-control-allow-origin") is not None

    def test_cors_preflight_with_complex_headers(self, client):
        """Test preflight with complex headers"""
        allowed_origin = "http://localhost:3000"

        response = client.options(
            "/api/v1/politicians",
            headers={
                "Origin": allowed_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization,X-CSRF-Token,X-Request-ID"
            }
        )

        assert response.status_code == 200
        allowed_headers = response.headers.get("access-control-allow-headers", "")
        assert "Authorization" in allowed_headers
        assert "Content-Type" in allowed_headers


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

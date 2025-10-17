"""
SQL Injection Prevention Tests
OWASP A03:2021 - Injection Testing
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.schemas.politician import PoliticianInfoRequest, PoliticianSearchParams
from app.services.evaluation_storage_service import EvaluationStorageService
from pydantic import ValidationError


class TestSQLInjectionPrevention:
    """Test SQL injection prevention in all user inputs"""

    # Standard SQL injection payloads
    SQL_INJECTION_PAYLOADS = [
        # Classic SQL injection
        "' OR '1'='1",
        "' OR 1=1--",
        "admin' --",
        "admin' #",
        "admin'/*",

        # UNION-based
        "' UNION SELECT * FROM users--",
        "' UNION SELECT NULL, NULL, NULL--",
        "1' UNION SELECT password FROM users WHERE username='admin'--",

        # Boolean-based blind
        "1' AND '1'='1",
        "1' AND '1'='2",

        # Time-based blind
        "1' AND SLEEP(5)--",
        "1'; WAITFOR DELAY '00:00:05'--",
        "1' AND BENCHMARK(5000000, MD5('test'))--",

        # Stacked queries
        "1'; DROP TABLE users; --",
        "1'; DELETE FROM politicians WHERE 1=1; --",
        "1'; UPDATE users SET password='hacked'; --",

        # Comment-based
        "1'-- -",
        "1'#",
        "1'/**/",

        # Encoded attacks
        "%27%20OR%201=1--",
        "0x27204f522031%3d31--",

        # Second-order injection
        "admin'||'test",
        "admin' + 'test",
    ]

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_politician_name_injection(self, payload):
        """Test SQL injection in politician name field"""
        with pytest.raises(ValidationError) as exc_info:
            PoliticianInfoRequest(
                name=payload,
                position="Mayor",
                party="TestParty",
                region="TestRegion"
            )

        # Should raise validation error
        assert "Invalid characters" in str(exc_info.value) or "SQL" in str(exc_info.value)

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_politician_position_injection(self, payload):
        """Test SQL injection in position field"""
        with pytest.raises(ValidationError):
            PoliticianInfoRequest(
                name="Valid Name",
                position=payload,
                party="TestParty",
                region="TestRegion"
            )

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_politician_party_injection(self, payload):
        """Test SQL injection in party field"""
        with pytest.raises(ValidationError):
            PoliticianInfoRequest(
                name="Valid Name",
                position="Mayor",
                party=payload,
                region="TestRegion"
            )

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_search_query_injection(self, payload):
        """Test SQL injection in search query"""
        with pytest.raises(ValidationError):
            PoliticianSearchParams(
                query=payload,
                page=1,
                limit=10
            )

    def test_numeric_field_injection(self):
        """Test SQL injection in numeric fields"""
        # Attempt to inject via pagination
        malicious_payloads = [
            "-1 OR 1=1",
            "1; DROP TABLE--",
            "999999999999999999999",  # Integer overflow
        ]

        for payload in malicious_payloads:
            # Should either raise ValidationError or convert to safe integer
            try:
                params = PoliticianSearchParams(
                    query="test",
                    page=payload,
                    limit=10
                )
                # If no error, should be converted to valid integer
                assert isinstance(params.page, int)
                assert 1 <= params.page <= 1000
            except ValidationError:
                # This is also acceptable
                pass

    def test_like_pattern_injection(self):
        """Test LIKE pattern injection with wildcards"""
        malicious_patterns = [
            "%' OR '1'='1",
            "_%' OR '1'='1",
            "\\%' OR '1'='1",
        ]

        for pattern in malicious_patterns:
            with pytest.raises(ValidationError):
                PoliticianSearchParams(query=pattern)

    def test_sort_field_injection(self):
        """Test SQL injection in sort field (should use whitelist)"""
        malicious_sort_fields = [
            "name; DROP TABLE politicians; --",
            "name' OR '1'='1",
            "(SELECT password FROM users)",
            "name UNION SELECT * FROM users",
        ]

        for field in malicious_sort_fields:
            with pytest.raises(ValidationError):
                PoliticianSearchParams(
                    query="test",
                    sort_by=field
                )

    def test_json_field_injection(self, db_session: Session):
        """Test NoSQL/JSON injection in JSONB fields"""
        from app.schemas.evaluation import EvaluationCreate

        malicious_json_data = {
            "politician_name": "Test",
            "politician_position": "Mayor",
            "politician_party": "Party",
            "ai_model": "claude",
            "data_sources": ["'; DROP TABLE--"],
            "raw_data_100": {
                "test'; DROP TABLE--": 5.0,
                "valid_key": 10.0
            },
            "category_scores": {
                "청렴성": 8.0,
                "'; DROP TABLE users; --": 5.0,
            },
            "rationale": {},
            "strengths": [],
            "weaknesses": [],
            "overall_assessment": "Test",
            "final_score": 80.0,
            "grade": "B"
        }

        # Should handle malicious keys safely
        service = EvaluationStorageService(db_session)

        # This should not cause SQL injection even with malicious keys
        # The ORM will treat them as literal strings
        try:
            # Pydantic validation should catch this
            evaluation = EvaluationCreate(**malicious_json_data)
        except ValidationError:
            # Expected to fail validation
            pass


class TestORMSafety:
    """Test that ORM prevents SQL injection"""

    def test_filter_with_user_input(self, db_session: Session):
        """Test SQLAlchemy filter with potentially malicious input"""
        from app.models.evaluation import PoliticianEvaluation

        malicious_name = "'; DROP TABLE politician_evaluations; --"

        # This should be safe with ORM
        result = db_session.query(PoliticianEvaluation)\
            .filter(PoliticianEvaluation.politician_name == malicious_name)\
            .first()

        # Should return None (no match) without executing injection
        assert result is None

        # Verify table still exists
        count = db_session.query(PoliticianEvaluation).count()
        assert count >= 0  # Table is intact

    def test_like_query_with_user_input(self, db_session: Session):
        """Test LIKE query safety"""
        from app.models.evaluation import PoliticianEvaluation

        malicious_pattern = "%'; DROP TABLE politician_evaluations; --"

        # Should be safe with ORM
        result = db_session.query(PoliticianEvaluation)\
            .filter(PoliticianEvaluation.politician_name.ilike(f"%{malicious_pattern}%"))\
            .all()

        # Should execute safely
        assert isinstance(result, list)

    def test_in_clause_with_user_input(self, db_session: Session):
        """Test IN clause safety"""
        from app.models.evaluation import PoliticianEvaluation

        malicious_list = [
            "Valid Name",
            "'; DROP TABLE politician_evaluations; --",
            "' OR '1'='1"
        ]

        # Should be safe with ORM
        result = db_session.query(PoliticianEvaluation)\
            .filter(PoliticianEvaluation.politician_name.in_(malicious_list))\
            .all()

        # Should execute safely
        assert isinstance(result, list)


class TestAPIEndpointSecurity:
    """Test SQL injection prevention in API endpoints"""

    def test_evaluation_endpoint_injection(self, client: TestClient):
        """Test evaluation endpoint with malicious input"""
        malicious_payload = {
            "name": "'; DROP TABLE politician_evaluations; --",
            "position": "Mayor",
            "party": "TestParty",
            "region": "TestRegion"
        }

        response = client.post("/api/v1/evaluation/evaluate-and-save", json=malicious_payload)

        # Should return 422 (validation error) or 400 (bad request)
        assert response.status_code in [422, 400]

        # Should not execute the injection
        # Verify by checking if table exists (in a real test, query the DB)

    def test_search_endpoint_injection(self, client: TestClient):
        """Test search endpoint with malicious query"""
        malicious_queries = [
            "?q=' OR '1'='1",
            "?q=test'; DROP TABLE politicians; --",
            "?party=' UNION SELECT * FROM users--",
        ]

        for query in malicious_queries:
            response = client.get(f"/api/v1/politicians/search{query}")

            # Should return 400 (bad request) or handle safely
            if response.status_code == 200:
                # If successful, should return empty or valid results
                data = response.json()
                assert isinstance(data, dict)
            else:
                # Should be 400 or 422
                assert response.status_code in [400, 422]

    def test_path_parameter_injection(self, client: TestClient):
        """Test SQL injection in path parameters"""
        malicious_ids = [
            "1' OR '1'='1",
            "1; DROP TABLE--",
            "1' UNION SELECT password FROM users--",
        ]

        for malicious_id in malicious_ids:
            response = client.get(f"/api/v1/evaluations/{malicious_id}")

            # Should return 400 (validation error) or 404 (not found)
            assert response.status_code in [400, 404, 422]


class TestInputValidation:
    """Test input validation functions"""

    def test_length_limits(self):
        """Test that length limits are enforced"""
        # Very long string (potential DoS)
        long_string = "A" * 10000

        with pytest.raises(ValidationError):
            PoliticianInfoRequest(
                name=long_string,
                position="Mayor",
                party="Party"
            )

    def test_special_character_handling(self):
        """Test handling of special characters"""
        valid_names = [
            "김철수",  # Korean
            "John Smith",  # English
            "Jean-Pierre",  # Hyphen
            "O'Brien",  # Apostrophe should be handled
        ]

        for name in valid_names:
            # These should be valid or have proper escaping
            try:
                request = PoliticianInfoRequest(
                    name=name,
                    position="Mayor",
                    party="Party"
                )
                assert request.name == name
            except ValidationError:
                # If validation fails, it should be documented why
                pass

    def test_whitelist_validation(self):
        """Test whitelist validation for sort fields"""
        valid_fields = ["name", "party", "region", "position", "created_at"]
        invalid_fields = [
            "password",
            "secret_key",
            "DROP TABLE",
            "'; --",
        ]

        for field in valid_fields:
            params = PoliticianSearchParams(
                query="test",
                sort_by=field
            )
            assert params.sort_by == field

        for field in invalid_fields:
            with pytest.raises(ValidationError):
                PoliticianSearchParams(
                    query="test",
                    sort_by=field
                )


class TestErrorHandling:
    """Test that errors don't expose SQL structure"""

    def test_database_error_message(self, client: TestClient):
        """Verify database errors don't expose SQL queries"""
        # Try to trigger a database error
        response = client.get("/api/v1/evaluations/invalid-uuid")

        assert response.status_code in [400, 404]

        data = response.json()
        error_message = str(data.get("detail", ""))

        # Should not contain SQL keywords
        sql_keywords = ["SELECT", "FROM", "WHERE", "TABLE", "COLUMN"]
        for keyword in sql_keywords:
            assert keyword not in error_message.upper()

    def test_validation_error_message(self, client: TestClient):
        """Verify validation errors are informative but safe"""
        response = client.post(
            "/api/v1/evaluation/evaluate-and-save",
            json={"name": "'; DROP TABLE--"}
        )

        assert response.status_code in [400, 422]

        # Should have error message
        data = response.json()
        assert "detail" in data or "error" in data


@pytest.fixture
def db_session():
    """Provide database session for tests"""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    """Provide test client"""
    from app.main import app
    return TestClient(app)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

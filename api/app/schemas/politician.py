"""
Politician-related Pydantic schemas with SQL injection prevention
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class PoliticianInfoRequest(BaseModel):
    """
    Request schema for politician information
    Includes strict validation to prevent SQL injection
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Politician name (Korean or English)"
    )
    position: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Current position or title"
    )
    party: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Political party affiliation"
    )
    region: Optional[str] = Field(
        None,
        max_length=100,
        description="Electoral region or administrative area"
    )

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """
        Validate politician name to prevent SQL injection
        - Removes dangerous SQL keywords
        - Prevents special SQL characters
        - Allows Korean, English, spaces, and hyphens only
        """
        # Strip whitespace
        v = v.strip()

        # Check for SQL injection patterns
        sql_patterns = [
            r"('|(--)|;|\/\*|\*\/)",  # SQL special characters
            r"\b(DROP|DELETE|INSERT|UPDATE|ALTER|EXEC|EXECUTE|UNION|SELECT|CREATE)\b",  # SQL keywords
            r"(0x[0-9a-f]+)",  # Hexadecimal
            r"(\bOR\b.*=.*\bOR\b)",  # OR injection patterns
        ]

        for pattern in sql_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(f"Invalid characters or SQL keywords detected in name: {v[:20]}")

        # Allow only Korean, English, spaces, hyphens, and dots
        if not re.match(r'^[가-힣a-zA-Z\s\.\-]+$', v):
            raise ValueError("Name can only contain Korean, English letters, spaces, dots, and hyphens")

        return v

    @field_validator('position')
    @classmethod
    def validate_position(cls, v: str) -> str:
        """Validate position field"""
        v = v.strip()

        # Check for SQL injection
        if re.search(r"('|(--)|;|\/\*|\*\/|\bDROP\b|\bDELETE\b)", v, re.IGNORECASE):
            raise ValueError("Invalid characters detected in position")

        return v

    @field_validator('party')
    @classmethod
    def validate_party(cls, v: str) -> str:
        """Validate party field"""
        v = v.strip()

        # Check for SQL injection
        if re.search(r"('|(--)|;|\/\*|\*\/|\bDROP\b|\bDELETE\b)", v, re.IGNORECASE):
            raise ValueError("Invalid characters detected in party")

        return v

    @field_validator('region')
    @classmethod
    def validate_region(cls, v: Optional[str]) -> Optional[str]:
        """Validate region field"""
        if v is None:
            return v

        v = v.strip()

        # Check for SQL injection
        if re.search(r"('|(--)|;|\/\*|\*\/|\bDROP\b|\bDELETE\b)", v, re.IGNORECASE):
            raise ValueError("Invalid characters detected in region")

        return v

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "박형준",
                "position": "부산광역시장",
                "party": "국민의힘",
                "region": "부산광역시"
            }]
        }
    }


class PoliticianSearchParams(BaseModel):
    """
    Search parameters with SQL injection prevention
    """

    query: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Search query"
    )
    party: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by party"
    )
    region: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by region"
    )
    position: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by position"
    )
    page: int = Field(
        1,
        ge=1,
        le=1000,
        description="Page number"
    )
    limit: int = Field(
        10,
        ge=1,
        le=100,
        description="Items per page"
    )
    sort_by: Optional[str] = Field(
        "name",
        pattern="^(name|party|region|position|created_at|updated_at)$",
        description="Sort field (whitelist only)"
    )
    sort_order: Optional[str] = Field(
        "asc",
        pattern="^(asc|desc)$",
        description="Sort order"
    )

    @field_validator('query')
    @classmethod
    def validate_search_query(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize search query to prevent SQL injection"""
        if v is None:
            return v

        # Remove SQL special characters
        v = v.strip()

        # Check for SQL injection patterns
        if re.search(r"('|(--)|;|\/\*|\*\/|\bUNION\b|\bSELECT\b)", v, re.IGNORECASE):
            raise ValueError("Invalid search query")

        return v


class PoliticianSortParams(BaseModel):
    """
    Sorting parameters with strict whitelist validation
    """

    ALLOWED_SORT_FIELDS = {
        'name', 'party', 'region', 'position',
        'created_at', 'updated_at'
    }

    field: str = Field(
        "name",
        description="Sort field"
    )
    ascending: bool = Field(
        True,
        description="Sort ascending (True) or descending (False)"
    )

    @field_validator('field')
    @classmethod
    def validate_sort_field(cls, v: str) -> str:
        """Validate sort field against whitelist"""
        if v not in cls.ALLOWED_SORT_FIELDS:
            raise ValueError(
                f"Invalid sort field. Allowed: {', '.join(cls.ALLOWED_SORT_FIELDS)}"
            )
        return v


class SafeFilterParams(BaseModel):
    """
    Safe filter parameters with type validation
    """

    field: str
    operator: str = Field(
        ...,
        pattern="^(eq|neq|gt|lt|gte|lte|in|like|ilike)$"
    )
    value: str | int | float | list

    @field_validator('field')
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Validate field name against whitelist"""
        allowed_fields = {
            'name', 'party', 'region', 'position',
            'birth_date', 'created_at', 'updated_at'
        }

        if v not in allowed_fields:
            raise ValueError(f"Invalid filter field: {v}")

        return v

    @field_validator('value')
    @classmethod
    def validate_value(cls, v: str | int | float | list) -> str | int | float | list:
        """Validate filter value"""
        if isinstance(v, str):
            # Check for SQL injection in string values
            if re.search(r"('|(--)|;|\/\*|\*\/)", v, re.IGNORECASE):
                raise ValueError("Invalid characters in filter value")

            # Limit string length
            if len(v) > 200:
                raise ValueError("Filter value too long")

        elif isinstance(v, list):
            # Limit array size to prevent DoS
            if len(v) > 50:
                raise ValueError("Too many filter values (max 50)")

            # Validate each item in list
            for item in v:
                if isinstance(item, str) and len(item) > 200:
                    raise ValueError("Filter value too long")

        return v

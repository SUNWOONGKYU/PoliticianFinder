"""
Services module for the application
"""

from .rating_aggregator import (
    RatingAggregator,
    RatingAggregationResult,
    trigger_aggregation_on_rating_change
)
from .evaluation_service import EvaluationService
from .evaluation_storage_service import EvaluationStorageService

__all__ = [
    'RatingAggregator',
    'RatingAggregationResult',
    'trigger_aggregation_on_rating_change',
    'EvaluationService',
    'EvaluationStorageService'
]
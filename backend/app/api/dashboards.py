from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.schemas.dashboard import DashboardErrorResponse, DashboardSchema
from app.services.dashboards import build_default_dashboard
from app.services.schema_validation import DashboardSchemaValidationError, validate_dashboard_schema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

_VALIDATION_ERROR_RESPONSE = DashboardErrorResponse.model_validate(
    {
        "error": {
            "code": "dashboard_schema_validation_failed",
            "message": "The default dashboard schema failed validation.",
        }
    }
)


def get_default_dashboard_candidate() -> dict[str, Any]:
    return build_default_dashboard()


@router.get(
    "/default",
    response_model=DashboardSchema,
    response_model_exclude_none=True,
    responses={500: {"model": DashboardErrorResponse}},
)
def get_default_dashboard(
    candidate: Annotated[dict[str, Any], Depends(get_default_dashboard_candidate)],
) -> DashboardSchema | JSONResponse:
    try:
        schema = DashboardSchema.model_validate(candidate)
    except ValidationError as error:
        _log_validation_failure("structure", len(error.errors()))
        return _validation_error_response()

    try:
        return validate_dashboard_schema(schema)
    except DashboardSchemaValidationError as error:
        _log_validation_failure("semantics", len(error.errors))
        return _validation_error_response()


def _log_validation_failure(stage: str, error_count: int) -> None:
    logger.error(
        "Default dashboard schema validation failed",
        extra={
            "validation_stage": stage,
            "validation_error_count": error_count,
        },
    )


def _validation_error_response() -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=_VALIDATION_ERROR_RESPONSE.model_dump(mode="json"),
    )

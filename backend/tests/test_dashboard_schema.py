from copy import deepcopy

import pytest
from pydantic import ValidationError

from app.schemas.dashboard import DashboardErrorResponse, DashboardSchema


@pytest.fixture
def valid_dashboard_payload() -> dict:
    return {
        "schema_version": "1.0",
        "dashboard_id": "portfolio-overview",
        "title": "시장 대비 보유 종목 점검",
        "description": "보유 종목의 손익과 상대수익률을 함께 확인한다.",
        "source": "PRESET",
        "layout": {
            "type": "responsive_grid",
            "columns": {"desktop": 12, "mobile": 1},
        },
        "data_requirements": [
            {
                "key": "positions",
                "type": "portfolio_positions",
                "filters": {"holding_status": "HELD_OR_WATCHLISTED"},
            }
        ],
        "widgets": [
            {
                "widget_id": "portfolio-summary",
                "type": "position_summary",
                "title": "포트폴리오 요약",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {
                    "show_unavailable_count": True,
                    "highlight_metric": "relative_return_rate",
                },
            },
            {
                "widget_id": "relative-return-table",
                "type": "position_table",
                "title": "상대수익률 순위",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 3},
                "options": {
                    "columns": [
                        "stock_name",
                        "market",
                        "held_quantity",
                        "average_cost",
                        "market_value",
                        "unrealized_profit_loss",
                        "stock_return_rate",
                        "market_return_rate",
                        "relative_return_rate",
                        "position_weight",
                        "calculation_status",
                    ],
                    "sort": {"field": "relative_return_rate", "direction": "desc"},
                },
            },
            {
                "widget_id": "mobile-position-cards",
                "type": "position_cards",
                "title": "종목 카드",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 2},
                "options": {
                    "primary_metric": "relative_return_rate",
                    "show_memo_badge": True,
                    "filter_strength": "ALL",
                },
            },
        ],
    }


def test_dashboard_schema_accepts_frontend_preset_shape(valid_dashboard_payload: dict) -> None:
    schema = DashboardSchema.model_validate(valid_dashboard_payload)

    assert schema.model_dump(mode="json", exclude_none=True) == valid_dashboard_payload


@pytest.mark.parametrize(
    ("mutation", "expected_error"),
    [
        (lambda payload: payload.update(schema_version="2.0"), "schema_version"),
        (lambda payload: payload["widgets"][0].update(type="unknown_widget"), "union_tag_invalid"),
        (lambda payload: payload["widgets"][0]["options"].update(script="alert(1)"), "extra_forbidden"),
        (lambda payload: payload["layout"]["columns"].update(desktop=0), "greater_than"),
        (lambda payload: payload.update(dashboard_id="   "), "string_too_short"),
    ],
)
def test_dashboard_schema_rejects_invalid_structure(
    valid_dashboard_payload: dict,
    mutation,
    expected_error: str,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    mutation(payload)

    with pytest.raises(ValidationError) as exc_info:
        DashboardSchema.model_validate(payload)

    assert expected_error in str(exc_info.value)


def test_dashboard_schema_rejects_duplicate_data_requirement_keys(
    valid_dashboard_payload: dict,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"].append(deepcopy(payload["data_requirements"][0]))

    with pytest.raises(ValidationError, match="data requirement keys must be unique"):
        DashboardSchema.model_validate(payload)


def test_dashboard_schema_rejects_duplicate_widget_ids(valid_dashboard_payload: dict) -> None:
    payload = deepcopy(valid_dashboard_payload)
    duplicate = deepcopy(payload["widgets"][0])
    payload["widgets"].append(duplicate)

    with pytest.raises(ValidationError, match="widget ids must be unique"):
        DashboardSchema.model_validate(payload)


def test_dashboard_error_response_has_stable_envelope() -> None:
    response = DashboardErrorResponse.model_validate(
        {
            "error": {
                "code": "dashboard_schema_validation_failed",
                "message": "The default dashboard schema failed validation.",
            }
        }
    )

    assert response.model_dump() == {
        "error": {
            "code": "dashboard_schema_validation_failed",
            "message": "The default dashboard schema failed validation.",
        }
    }

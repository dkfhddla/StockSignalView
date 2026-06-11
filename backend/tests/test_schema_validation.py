from copy import deepcopy

import pytest

from app.schemas.dashboard import DashboardSchema
from app.services.dashboards import build_default_dashboard
from app.services.schema_validation import DashboardSchemaValidationError, validate_dashboard_schema


def _schema(payload: dict) -> DashboardSchema:
    return DashboardSchema.model_validate(payload)


def _single_widget_payload(widget: dict, data_requirements: list[dict]) -> dict:
    payload = build_default_dashboard()
    payload["widgets"] = [widget]
    payload["data_requirements"] = data_requirements
    return payload


def test_default_dashboard_is_fresh_and_valid() -> None:
    first = build_default_dashboard()
    second = build_default_dashboard()

    first["widgets"][0]["title"] = "changed"
    validated = validate_dashboard_schema(_schema(second))

    assert second["dashboard_id"] == "portfolio-overview"
    assert second["widgets"][0]["title"] == "포트폴리오 요약"
    assert validated is not None


@pytest.mark.parametrize(
    ("widget", "data_requirements"),
    [
        (
            {
                "widget_id": "summary",
                "type": "position_summary",
                "title": "요약",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {
                    "show_unavailable_count": True,
                    "highlight_metric": "relative_return_rate",
                },
            },
            [{"key": "positions", "type": "portfolio_positions"}],
        ),
        (
            {
                "widget_id": "table",
                "type": "position_table",
                "title": "표",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {
                    "columns": ["relative_return_rate"],
                    "sort": {"field": "relative_return_rate", "direction": "desc"},
                },
            },
            [{"key": "positions", "type": "portfolio_positions"}],
        ),
        (
            {
                "widget_id": "cards",
                "type": "position_cards",
                "title": "카드",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {
                    "primary_metric": "relative_return_rate",
                    "show_memo_badge": True,
                    "filter_strength": "ALL",
                },
            },
            [{"key": "positions", "type": "portfolio_positions"}],
        ),
        (
            {
                "widget_id": "chart",
                "type": "relative_return_chart",
                "title": "차트",
                "data_key": "positions",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {"chart_type": "bar"},
            },
            [{"key": "positions", "type": "portfolio_positions"}],
        ),
        (
            {
                "widget_id": "timeline",
                "type": "decision_timeline",
                "title": "타임라인",
                "data_key": "trades",
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {"show_profit_context": True},
            },
            [{"key": "trades", "type": "trades"}],
        ),
        (
            {
                "widget_id": "alerts",
                "type": "alert_status_list",
                "title": "알림",
                "data_keys": ["rules", "events"],
                "layout": {"desktop_span": 12, "mobile_order": 1},
                "options": {"status_filter": "ALL", "group_by_stock": True},
            },
            [
                {"key": "rules", "type": "alert_rules"},
                {"key": "events", "type": "alert_events"},
            ],
        ),
    ],
)
def test_validator_accepts_registered_widget_bindings(widget: dict, data_requirements: list[dict]) -> None:
    schema = _schema(_single_widget_payload(widget, data_requirements))

    assert validate_dashboard_schema(schema) is schema


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (
            lambda payload: payload["widgets"][0].update(data_key="missing"),
            "is not declared",
        ),
        (
            lambda payload: payload["data_requirements"][0].update(type="trades"),
            "requires portfolio_positions",
        ),
        (
            lambda payload: payload["widgets"][1]["options"].update(
                columns=["stock_name"],
                sort={"field": "relative_return_rate", "direction": "desc"},
            ),
            "sort field must be included",
        ),
    ],
)
def test_validator_rejects_invalid_default_dashboard_bindings(mutate, message: str) -> None:
    payload = build_default_dashboard()
    mutate(payload)
    schema = _schema(payload)
    original = schema.model_dump(mode="json")

    with pytest.raises(DashboardSchemaValidationError, match=message):
        validate_dashboard_schema(schema)

    assert schema.model_dump(mode="json") == original


@pytest.mark.parametrize(
    ("data_keys", "data_requirements", "message"),
    [
        (
            ["rules"],
            [{"key": "rules", "type": "alert_rules"}],
            "exactly two distinct",
        ),
        (
            ["rules", "missing"],
            [{"key": "rules", "type": "alert_rules"}],
            "is not declared",
        ),
        (
            ["rules", "trades"],
            [
                {"key": "rules", "type": "alert_rules"},
                {"key": "trades", "type": "trades"},
            ],
            "requires alert_rules and alert_events",
        ),
    ],
)
def test_validator_rejects_invalid_alert_bindings(
    data_keys: list[str],
    data_requirements: list[dict],
    message: str,
) -> None:
    widget = {
        "widget_id": "alerts",
        "type": "alert_status_list",
        "title": "알림",
        "data_keys": data_keys,
        "layout": {"desktop_span": 12, "mobile_order": 1},
        "options": {"status_filter": "ALL", "group_by_stock": True},
    }
    schema = _schema(_single_widget_payload(widget, data_requirements))

    with pytest.raises(DashboardSchemaValidationError, match=message):
        validate_dashboard_schema(schema)


@pytest.mark.parametrize(
    ("field", "message"),
    [
        ("data_requirements", "at least one data requirement"),
        ("widgets", "at least one widget"),
    ],
)
def test_validator_rejects_empty_rendering_contract(field: str, message: str) -> None:
    payload = build_default_dashboard()
    payload[field] = []

    with pytest.raises(DashboardSchemaValidationError, match=message):
        validate_dashboard_schema(_schema(payload))

from copy import deepcopy

import pytest
from pydantic import ValidationError

from app.schemas.dashboard import DashboardErrorResponse, DashboardSchema


def provider_metadata() -> dict:
    return {
        "attribution": {
            "provider": "Toss Securities",
            "source": "BROKER_API",
            "captured_at": "2026-08-24T09:00:00+09:00",
            "refreshed_at": "2026-08-24T09:01:00+09:00",
        },
        "status": {
            "data_status": "STALE",
            "lookup_results": [
                {
                    "lookup_type": "HOLDINGS",
                    "target_key": "account-primary",
                    "target_label": "주 계좌",
                    "lookup_status": "UNAUTHORIZED",
                }
            ],
        },
    }


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


def test_dashboard_schema_accepts_provider_metadata(valid_dashboard_payload: dict) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"][0]["provider_metadata"] = provider_metadata()

    schema = DashboardSchema.model_validate(payload)

    assert schema.model_dump(mode="json", exclude_none=True) == payload


def test_dashboard_schema_accepts_distinct_price_lookup_roles(
    valid_dashboard_payload: dict,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    metadata = provider_metadata()
    metadata["status"]["lookup_results"].extend(
        [
            {
                "lookup_type": "PRICE",
                "target_key": "stock-005930",
                "target_label": "삼성전자",
                "snapshot_role": "CURRENT",
                "lookup_status": "AVAILABLE",
            },
            {
                "lookup_type": "PRICE",
                "target_key": "stock-005930",
                "target_label": "삼성전자",
                "snapshot_role": "DAY_BASELINE",
                "lookup_status": "UNAVAILABLE",
            },
        ]
    )
    payload["data_requirements"][0]["provider_metadata"] = metadata

    schema = DashboardSchema.model_validate(payload)

    assert schema.model_dump(mode="json", exclude_none=True) == payload


@pytest.mark.parametrize(
    ("mutation", "expected_error"),
    [
        (lambda metadata: metadata.pop("attribution"), "attribution"),
        (lambda metadata: metadata["attribution"].update(provider=" "), "string_too_short"),
        (lambda metadata: metadata["attribution"].update(source="REMOTE"), "source"),
        (
            lambda metadata: metadata["attribution"].update(
                refreshed_at="2026-08-24T09:01:00"
            ),
            "timezone-aware ISO 8601 string",
        ),
        (lambda metadata: metadata["attribution"].update(refreshed_at=0), "ISO 8601 string"),
        (
            lambda metadata: metadata["attribution"].update(
                refreshed_at="2026-02-30T09:01:00Z"
            ),
            "valid calendar date",
        ),
        (lambda metadata: metadata["status"].update(data_status="FRESH"), "data_status"),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                lookup_status="ERROR"
            ),
            "lookup_status",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                lookup_type="ACCOUNT"
            ),
            "lookup_type",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                target_key=" "
            ),
            "string_too_short",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                target_label=None
            ),
            "target_label must be omitted",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                lookup_type="PRICE"
            ),
            "require snapshot_role",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                snapshot_role="CURRENT"
            ),
            "HOLDINGS lookup results cannot define snapshot_role",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                lookup_type="PRICE", snapshot_role="BASELINE"
            ),
            "snapshot_role",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"][0].update(
                lookup_type="PRICE", snapshot_role=None
            ),
            "snapshot_role must be omitted",
        ),
        (
            lambda metadata: metadata["status"].update(lookup_results=[]),
            "at least one result",
        ),
        (
            lambda metadata: metadata["status"]["lookup_results"].append(
                deepcopy(metadata["status"]["lookup_results"][0])
            ),
            "targets must be unique",
        ),
        (
            lambda metadata: metadata["status"].pop("lookup_results"),
            "require lookup_results",
        ),
        (
            lambda metadata: metadata["status"].update(lookup_status="AVAILABLE"),
            "extra_forbidden",
        ),
        (lambda metadata: metadata["attribution"].pop("captured_at"), "require captured_at"),
        (
            lambda metadata: metadata["attribution"].update(source="MANUAL"),
            "MANUAL source cannot define lookup_results",
        ),
        (lambda metadata: metadata["status"].update(error="token expired"), "extra_forbidden"),
    ],
)
def test_dashboard_schema_rejects_invalid_provider_metadata(
    valid_dashboard_payload: dict,
    mutation,
    expected_error: str,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    metadata = provider_metadata()
    mutation(metadata)
    payload["data_requirements"][0]["provider_metadata"] = metadata

    with pytest.raises(ValidationError) as exc_info:
        DashboardSchema.model_validate(payload)

    assert expected_error in str(exc_info.value)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("provider_metadata", None),
        ("captured_at", None),
        ("data_status", None),
        ("lookup_results", None),
    ],
)
def test_dashboard_schema_rejects_null_optional_provider_metadata_fields(
    valid_dashboard_payload: dict,
    field: str,
    value,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    metadata = provider_metadata()
    if field == "provider_metadata":
        payload["data_requirements"][0][field] = value
    elif field == "captured_at":
        metadata["attribution"][field] = value
        payload["data_requirements"][0]["provider_metadata"] = metadata
    else:
        metadata["status"][field] = value
        payload["data_requirements"][0]["provider_metadata"] = metadata

    with pytest.raises(ValidationError):
        DashboardSchema.model_validate(payload)


def test_dashboard_schema_accepts_local_attribution_without_lookup_results(
    valid_dashboard_payload: dict,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"][0]["provider_metadata"] = {
        "attribution": {
            "provider": "StockSignalView",
            "source": "MANUAL",
            "refreshed_at": "2026-08-24T09:01:00+09:00",
        },
        "status": {},
    }

    schema = DashboardSchema.model_validate(payload)

    assert schema.model_dump(mode="json", exclude_none=True) == payload


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


@pytest.mark.parametrize(
    "filters",
    [
        None,
        {"endpoint": "https://example.com/feed"},
        {"query": "DROP TABLE trades"},
        {"holding_status": "ALL"},
    ],
)
def test_dashboard_schema_rejects_unsupported_filters(
    valid_dashboard_payload: dict,
    filters: dict[str, str],
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"][0]["filters"] = filters

    with pytest.raises(ValidationError):
        DashboardSchema.model_validate(payload)


def test_dashboard_schema_rejects_filters_for_other_data_types(
    valid_dashboard_payload: dict,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"][0] = {
        "key": "trades",
        "type": "trades",
        "filters": {"holding_status": "HELD_OR_WATCHLISTED"},
    }
    payload["widgets"] = []

    with pytest.raises(ValidationError, match="filters are only supported"):
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


@pytest.mark.parametrize(
    "widget",
    [
        {
            "widget_id": "relative-return-chart",
            "type": "relative_return_chart",
            "title": "상대수익률 차트",
            "data_key": "positions",
            "layout": {"desktop_span": 12, "mobile_order": 4},
            "options": {
                "chart_type": "ranked_bar",
                "limit": 10,
                "baseline": "market_return_rate",
            },
        },
        {
            "widget_id": "decision-timeline",
            "type": "decision_timeline",
            "title": "거래 판단 타임라인",
            "data_key": "trades",
            "layout": {"desktop_span": 12, "mobile_order": 5},
            "options": {
                "stock_id": "005930",
                "trade_types": ["BUY", "SELL"],
                "show_profit_context": True,
            },
        },
        {
            "widget_id": "alert-status-list",
            "type": "alert_status_list",
            "title": "알림 상태",
            "data_keys": ["alert-rules", "alert-events"],
            "layout": {"desktop_span": 12, "mobile_order": 6},
            "options": {
                "status_filter": "ALL",
                "group_by_stock": True,
            },
        },
    ],
)
def test_dashboard_schema_accepts_each_registered_widget_shape(
    valid_dashboard_payload: dict,
    widget: dict,
) -> None:
    payload = deepcopy(valid_dashboard_payload)
    payload["data_requirements"].extend(
        [
            {"key": "trades", "type": "trades"},
            {"key": "alert-rules", "type": "alert_rules"},
            {"key": "alert-events", "type": "alert_events"},
        ]
    )
    payload["widgets"] = [widget]

    schema = DashboardSchema.model_validate(payload)

    assert schema.widgets[0].type == widget["type"]

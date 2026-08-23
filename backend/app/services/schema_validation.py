from __future__ import annotations

from collections.abc import Iterable

from app.schemas.dashboard import (
    AlertStatusListWidget,
    DashboardDataType,
    DashboardSchema,
    DashboardSource,
    DecisionTimelineWidget,
    PositionTableWidget,
)

_PORTFOLIO_WIDGET_TYPES = {
    "position_summary",
    "position_table",
    "position_cards",
    "relative_return_chart",
}


class DashboardSchemaValidationError(ValueError):
    def __init__(self, errors: Iterable[str]) -> None:
        self.errors = tuple(errors)
        super().__init__("; ".join(self.errors))


def validate_dashboard_schema(schema: DashboardSchema) -> DashboardSchema:
    data_types = {requirement.key: requirement.type for requirement in schema.data_requirements}
    errors: list[str] = []

    if not schema.data_requirements:
        errors.append("dashboard requires at least one data requirement")
    if not schema.widgets:
        errors.append("dashboard requires at least one widget")
    if schema.source is DashboardSource.AI_PLANNER:
        missing_metadata = [
            requirement.key
            for requirement in schema.data_requirements
            if requirement.provider_metadata is None
        ]
        if missing_metadata:
            errors.append(
                "AI_PLANNER data requirements require provider metadata: "
                + ", ".join(missing_metadata)
            )

    for widget in schema.widgets:
        if isinstance(widget, AlertStatusListWidget):
            _validate_alert_binding(widget, data_types, errors)
            continue

        data_type = data_types.get(widget.data_key)
        if data_type is None:
            errors.append(f"{widget.widget_id}: data key '{widget.data_key}' is not declared")
            continue

        if widget.type in _PORTFOLIO_WIDGET_TYPES:
            if data_type is not DashboardDataType.PORTFOLIO_POSITIONS:
                errors.append(f"{widget.widget_id}: requires portfolio_positions data")
        elif isinstance(widget, DecisionTimelineWidget):
            if data_type is not DashboardDataType.TRADES:
                errors.append(f"{widget.widget_id}: requires trades data")

        if isinstance(widget, PositionTableWidget) and widget.options.sort.field not in widget.options.columns:
            errors.append(f"{widget.widget_id}: sort field must be included in columns")

    if errors:
        raise DashboardSchemaValidationError(errors)

    return schema


def _validate_alert_binding(
    widget: AlertStatusListWidget,
    data_types: dict[str, DashboardDataType],
    errors: list[str],
) -> None:
    if len(widget.data_keys) != 2 or len(set(widget.data_keys)) != 2:
        errors.append(f"{widget.widget_id}: requires exactly two distinct data keys")
        return

    bound_types: list[DashboardDataType] = []
    for data_key in widget.data_keys:
        data_type = data_types.get(data_key)
        if data_type is None:
            errors.append(f"{widget.widget_id}: data key '{data_key}' is not declared")
            continue
        bound_types.append(data_type)

    if len(bound_types) == 2 and set(bound_types) != {
        DashboardDataType.ALERT_RULES,
        DashboardDataType.ALERT_EVENTS,
    }:
        errors.append(f"{widget.widget_id}: requires alert_rules and alert_events data")

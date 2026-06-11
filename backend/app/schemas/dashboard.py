from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, PositiveInt, StringConstraints, model_validator

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DashboardSource(str, Enum):
    PRESET = "PRESET"
    AI_PLANNER = "AI_PLANNER"
    USER_SAVED = "USER_SAVED"


class DashboardDataType(str, Enum):
    STOCKS = "stocks"
    PORTFOLIO_POSITIONS = "portfolio_positions"
    TRADES = "trades"
    ALERT_RULES = "alert_rules"
    ALERT_EVENTS = "alert_events"


class PositionTableColumn(str, Enum):
    STOCK_NAME = "stock_name"
    MARKET = "market"
    HELD_QUANTITY = "held_quantity"
    AVERAGE_COST = "average_cost"
    MARKET_VALUE = "market_value"
    UNREALIZED_PROFIT_LOSS = "unrealized_profit_loss"
    REALIZED_PROFIT_LOSS = "realized_profit_loss"
    POSITION_WEIGHT = "position_weight"
    STOCK_RETURN_RATE = "stock_return_rate"
    MARKET_RETURN_RATE = "market_return_rate"
    RELATIVE_RETURN_RATE = "relative_return_rate"
    STRENGTH_STATUS = "strength_status"
    CALCULATION_STATUS = "calculation_status"


class DashboardColumns(StrictModel):
    desktop: PositiveInt
    mobile: PositiveInt


class DashboardLayout(StrictModel):
    type: Literal["responsive_grid"]
    columns: DashboardColumns


class DashboardDataRequirement(StrictModel):
    key: NonEmptyString
    type: DashboardDataType
    filters: dict[str, str] | None = None


class WidgetLayout(StrictModel):
    desktop_span: PositiveInt
    mobile_order: PositiveInt


class BaseWidget(StrictModel):
    widget_id: NonEmptyString
    title: NonEmptyString
    layout: WidgetLayout


class PositionSummaryOptions(StrictModel):
    show_unavailable_count: bool
    highlight_metric: Literal["unrealized_profit_loss", "relative_return_rate"]


class PositionSummaryWidget(BaseWidget):
    type: Literal["position_summary"]
    data_key: NonEmptyString
    options: PositionSummaryOptions


class PositionTableSort(StrictModel):
    field: PositionTableColumn
    direction: Literal["asc", "desc"]


class PositionTableOptions(StrictModel):
    columns: list[PositionTableColumn]
    sort: PositionTableSort
    limit: PositiveInt | None = None


class PositionTableWidget(BaseWidget):
    type: Literal["position_table"]
    data_key: NonEmptyString
    options: PositionTableOptions


class PositionCardsOptions(StrictModel):
    primary_metric: Literal[
        "unrealized_profit_loss",
        "relative_return_rate",
        "stock_return_rate",
    ]
    show_memo_badge: bool
    filter_strength: Literal["STRONG", "WEAK", "ALL"]


class PositionCardsWidget(BaseWidget):
    type: Literal["position_cards"]
    data_key: NonEmptyString
    options: PositionCardsOptions


class RelativeReturnChartOptions(StrictModel):
    chart_type: Literal["bar", "ranked_bar"]
    limit: PositiveInt | None = None
    baseline: Literal["market_return_rate"] | None = None


class RelativeReturnChartWidget(BaseWidget):
    type: Literal["relative_return_chart"]
    data_key: NonEmptyString
    options: RelativeReturnChartOptions


class DecisionTimelineOptions(StrictModel):
    stock_id: NonEmptyString | None = None
    trade_types: list[Literal["BUY", "SELL"]] | None = None
    show_profit_context: bool


class DecisionTimelineWidget(BaseWidget):
    type: Literal["decision_timeline"]
    data_key: NonEmptyString
    options: DecisionTimelineOptions


class AlertStatusListOptions(StrictModel):
    status_filter: Literal["TRIGGERED", "NOT_TRIGGERED", "UNAVAILABLE", "ALL"]
    group_by_stock: bool


class AlertStatusListWidget(BaseWidget):
    type: Literal["alert_status_list"]
    data_keys: list[NonEmptyString]
    options: AlertStatusListOptions


DashboardWidget = Annotated[
    Union[
        PositionSummaryWidget,
        PositionTableWidget,
        PositionCardsWidget,
        RelativeReturnChartWidget,
        DecisionTimelineWidget,
        AlertStatusListWidget,
    ],
    Field(discriminator="type"),
]


class DashboardSchema(StrictModel):
    schema_version: Literal["1.0"]
    dashboard_id: NonEmptyString
    title: NonEmptyString
    description: str | None = None
    source: DashboardSource
    layout: DashboardLayout
    data_requirements: list[DashboardDataRequirement]
    widgets: list[DashboardWidget]

    @model_validator(mode="after")
    def validate_unique_identifiers(self) -> DashboardSchema:
        data_keys = [requirement.key for requirement in self.data_requirements]
        if len(data_keys) != len(set(data_keys)):
            raise ValueError("data requirement keys must be unique")

        widget_ids = [widget.widget_id for widget in self.widgets]
        if len(widget_ids) != len(set(widget_ids)):
            raise ValueError("widget ids must be unique")

        return self


class DashboardErrorDetail(StrictModel):
    code: NonEmptyString
    message: NonEmptyString


class DashboardErrorResponse(StrictModel):
    error: DashboardErrorDetail

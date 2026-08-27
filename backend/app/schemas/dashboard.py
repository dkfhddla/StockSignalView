from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal, Union

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    PositiveInt,
    StringConstraints,
    field_validator,
    model_validator,
)

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
_AWARE_TIMESTAMP_PATTERN = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$"
)


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


class DashboardDataSource(str, Enum):
    MANUAL = "MANUAL"
    BROKER_API = "BROKER_API"
    MARKET_API = "MARKET_API"
    IMPORT = "IMPORT"
    MOCK = "MOCK"


class DashboardDataStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"


class DashboardLookupStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    PROVIDER_ERROR = "PROVIDER_ERROR"
    UNSUPPORTED = "UNSUPPORTED"


class DashboardLookupType(str, Enum):
    HOLDINGS = "HOLDINGS"
    PRICE = "PRICE"
    MARKET_INDEX = "MARKET_INDEX"


class DashboardSnapshotRole(str, Enum):
    CURRENT = "CURRENT"
    DAY_BASELINE = "DAY_BASELINE"
    HOLDING_PERIOD_BASELINE = "HOLDING_PERIOD_BASELINE"


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


class PortfolioPositionFilters(StrictModel):
    holding_status: Literal["HELD_OR_WATCHLISTED"]


class DashboardDataAttribution(StrictModel):
    provider: NonEmptyString
    source: DashboardDataSource
    captured_at: AwareDatetime | None = None
    refreshed_at: AwareDatetime

    @field_validator("captured_at", "refreshed_at", mode="before")
    @classmethod
    def validate_timestamp_string(cls, value: Any) -> Any:
        if value is None:
            return value
        if not isinstance(value, str) or _AWARE_TIMESTAMP_PATTERN.fullmatch(value) is None:
            raise ValueError("timestamp must be a timezone-aware ISO 8601 string")
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise ValueError("timestamp must be a valid calendar date") from error
        return value

    @model_validator(mode="before")
    @classmethod
    def reject_null_captured_at(cls, data: Any) -> Any:
        if isinstance(data, dict) and "captured_at" in data and data["captured_at"] is None:
            raise ValueError("captured_at must be omitted or define a timestamp")
        return data


class DashboardLookupResult(StrictModel):
    lookup_type: DashboardLookupType
    target_key: NonEmptyString
    target_label: NonEmptyString | None = None
    snapshot_role: DashboardSnapshotRole | None = None
    lookup_status: DashboardLookupStatus

    @model_validator(mode="before")
    @classmethod
    def reject_null_optional_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "target_label" in data and data["target_label"] is None:
                raise ValueError("target_label must be omitted or define a display label")
            if "snapshot_role" in data and data["snapshot_role"] is None:
                raise ValueError("snapshot_role must be omitted or define a supported role")
        return data

    @model_validator(mode="after")
    def validate_lookup_contract(self) -> DashboardLookupResult:
        if self.lookup_type in {
            DashboardLookupType.PRICE,
            DashboardLookupType.MARKET_INDEX,
        } and self.snapshot_role is None:
            raise ValueError("PRICE and MARKET_INDEX lookup results require snapshot_role")
        if self.lookup_type is DashboardLookupType.HOLDINGS and self.snapshot_role is not None:
            raise ValueError("HOLDINGS lookup results cannot define snapshot_role")
        if self.lookup_type is DashboardLookupType.HOLDINGS and self.target_label is None:
            raise ValueError("HOLDINGS lookup results require target_label")
        return self


class DashboardProviderStatus(StrictModel):
    data_status: DashboardDataStatus | None = None
    lookup_results: list[DashboardLookupResult] | None = None

    @model_validator(mode="before")
    @classmethod
    def reject_null_optional_statuses(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "data_status" in data and data["data_status"] is None:
                raise ValueError("data_status must be omitted or define a supported status")
            if "lookup_results" in data and data["lookup_results"] is None:
                raise ValueError("lookup_results must be omitted or define lookup results")
        return data

    @model_validator(mode="after")
    def validate_lookup_results(self) -> DashboardProviderStatus:
        if self.lookup_results is None:
            return self
        if not self.lookup_results:
            raise ValueError("lookup_results must contain at least one result")

        lookup_targets = [
            (result.lookup_type, result.target_key, result.snapshot_role)
            for result in self.lookup_results
        ]
        if len(lookup_targets) != len(set(lookup_targets)):
            raise ValueError("lookup_results targets must be unique")
        return self


class DashboardProviderMetadata(StrictModel):
    attribution: DashboardDataAttribution
    status: DashboardProviderStatus

    @model_validator(mode="after")
    def validate_status_for_attribution(self) -> DashboardProviderMetadata:
        if (
            self.attribution.source
            in {DashboardDataSource.BROKER_API, DashboardDataSource.MARKET_API}
            and self.status.lookup_results is None
        ):
            raise ValueError("provider API sources require lookup_results")
        if (
            self.attribution.source is DashboardDataSource.MANUAL
            and self.status.lookup_results is not None
        ):
            raise ValueError("MANUAL source cannot define lookup_results")
        if (
            self.status.data_status
            in {DashboardDataStatus.AVAILABLE, DashboardDataStatus.STALE}
            and self.attribution.captured_at is None
        ):
            raise ValueError("AVAILABLE and STALE data require captured_at")
        return self


class DashboardDataRequirement(StrictModel):
    key: NonEmptyString
    type: DashboardDataType
    filters: PortfolioPositionFilters | None = None
    provider_metadata: DashboardProviderMetadata | None = None

    @model_validator(mode="before")
    @classmethod
    def reject_null_optional_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "filters" in data and data["filters"] is None:
                raise ValueError("filters must be omitted or define a supported filter")
            if "provider_metadata" in data and data["provider_metadata"] is None:
                raise ValueError("provider_metadata must be omitted or define metadata")
        return data

    @model_validator(mode="after")
    def validate_filters_for_data_type(self) -> DashboardDataRequirement:
        if self.filters is not None and self.type is not DashboardDataType.PORTFOLIO_POSITIONS:
            raise ValueError("filters are only supported for portfolio_positions")
        return self


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

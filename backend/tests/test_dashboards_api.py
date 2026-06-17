import logging

import pytest
from fastapi.testclient import TestClient

from app.api.dashboards import get_default_dashboard_candidate
from app.main import app
from app.services.dashboards import build_default_dashboard


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_default_dashboard_endpoint_returns_validated_schema(client: TestClient) -> None:
    response = client.get("/dashboards/default")

    assert response.status_code == 200
    assert response.json() == build_default_dashboard()


@pytest.mark.parametrize(
    ("candidate_factory", "expected_stage"),
    [
        (
            lambda: {**build_default_dashboard(), "schema_version": "2.0"},
            "structure",
        ),
        (
            lambda: _with_invalid_semantic_binding(build_default_dashboard()),
            "semantics",
        ),
    ],
)
def test_default_dashboard_endpoint_fails_closed_for_validation_errors(
    client: TestClient,
    caplog: pytest.LogCaptureFixture,
    candidate_factory,
    expected_stage: str,
) -> None:
    app.dependency_overrides[get_default_dashboard_candidate] = candidate_factory

    with caplog.at_level(logging.ERROR, logger="app.api.dashboards"):
        response = client.get("/dashboards/default")

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "dashboard_schema_validation_failed",
            "message": "The default dashboard schema failed validation.",
        }
    }
    assert "dashboard_id" not in response.text
    assert "widgets" not in response.text
    assert len(caplog.records) == 1
    assert caplog.records[0].validation_stage == expected_stage
    assert caplog.records[0].validation_error_count >= 1
    assert "portfolio-overview" not in caplog.text
    assert "widgets" not in caplog.text
    assert "Traceback" not in caplog.text


def test_default_dashboard_endpoint_does_not_mask_unrelated_errors(client: TestClient) -> None:
    def raise_unrelated_error() -> dict:
        raise RuntimeError("unexpected failure")

    app.dependency_overrides[get_default_dashboard_candidate] = raise_unrelated_error

    with pytest.raises(RuntimeError, match="unexpected failure"):
        client.get("/dashboards/default")


def test_unrelated_errors_use_safe_json_wire_response() -> None:
    def raise_unrelated_error() -> dict:
        raise RuntimeError("sensitive internal detail")

    app.dependency_overrides[get_default_dashboard_candidate] = raise_unrelated_error
    try:
        with TestClient(app, raise_server_exceptions=False) as wire_client:
            response = wire_client.get("/dashboards/default")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {
        "error": {
            "code": "internal_server_error",
            "message": "An unexpected server error occurred.",
        }
    }
    assert "sensitive internal detail" not in response.text


def test_openapi_documents_success_and_validation_failure_models(client: TestClient) -> None:
    operation = client.get("/openapi.json").json()["paths"]["/dashboards/default"]["get"]

    assert set(operation["responses"]) >= {"200", "500"}
    assert operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/DashboardSchema"
    )
    assert operation["responses"]["500"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/DashboardErrorResponse"
    )


def _with_invalid_semantic_binding(candidate: dict) -> dict:
    candidate["data_requirements"][0]["type"] = "trades"
    candidate["data_requirements"][0].pop("filters", None)
    return candidate

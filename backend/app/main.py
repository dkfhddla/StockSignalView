import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.dashboards import router as dashboards_router
from app.schemas.dashboard import DashboardErrorResponse

logger = logging.getLogger(__name__)

app = FastAPI(title="StockSignalView API")
app.include_router(dashboards_router)


@app.exception_handler(Exception)
async def handle_internal_server_error(request: Request, error: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled server error",
        extra={"request_method": request.method, "request_path": request.url.path},
    )
    response = DashboardErrorResponse.model_validate(
        {
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected server error occurred.",
            }
        }
    )
    return JSONResponse(status_code=500, content=response.model_dump(mode="json"))

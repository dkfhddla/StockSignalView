from fastapi import FastAPI

from app.api.dashboards import router as dashboards_router

app = FastAPI(title="StockSignalView API")
app.include_router(dashboards_router)

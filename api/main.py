"""ReturnGuard FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    admin,
    analytics,
    assistant,
    customers,
    disputes,
    events,
    investigations,
    models,
    payments,
    reviews,
    score,
    transactions_investigation,
    webhooks,
)
from auth.embed_tokens import router as auth_router
from db.seed import init_and_seed_db

logger = logging.getLogger("returnguard.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database tables and seed default data on startup."""
    try:
        init_and_seed_db()
    except Exception as exc:
        logger.error("Failed to initialize or seed database: %s", exc, exc_info=True)
    yield


app = FastAPI(
    title="ReturnGuard API",
    description="AI-powered return-abuse risk detection and dispute evidence API",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS origins from environment with automatic cloud platform support
cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS") or os.environ.get("CORS_ORIGINS") or ""
cors_origins_list = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

if "*" in cors_origins_list or cors_origins_env.strip() == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    allowed_origins = list(set(default_origins + cors_origins_list))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)*(onrender\.com|vercel\.app|netlify\.app)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Wire auth routes
app.include_router(auth_router)

# Wire feature routers
app.include_router(score.router)
app.include_router(events.router)
app.include_router(customers.router)
app.include_router(reviews.router)
app.include_router(analytics.router)
app.include_router(models.router)
app.include_router(payments.router)
app.include_router(webhooks.router)
app.include_router(disputes.router)
app.include_router(investigations.router)
app.include_router(transactions_investigation.router)
app.include_router(assistant.router)
app.include_router(admin.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

"""ReturnGuard FastAPI Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
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

app = FastAPI(
    title="ReturnGuard API",
    description="AI-powered return-abuse risk detection and dispute evidence API",
    version="0.1.0",
)

import os

# Configure CORS origins from environment, defaulting to standard local dev ports
# Note: Wildcard "*" cannot be used when allow_credentials=True
cors_origins_env = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

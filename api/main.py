"""ReturnGuard FastAPI Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    analytics,
    assistant,
    customers,
    disputes,
    events,
    models,
    payments,
    reviews,
    score,
    webhooks,
)
from auth.embed_tokens import router as auth_router

app = FastAPI(
    title="ReturnGuard API",
    description="AI-powered return-abuse risk detection and dispute evidence API",
    version="0.1.0",
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(assistant.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

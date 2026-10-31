"""ReturnGuard FastAPI Application Entrypoint."""
from fastapi import FastAPI
from api.routes import assistant, disputes, payments, score, webhooks

app = FastAPI(
    title="ReturnGuard API",
    description="AI-powered return-abuse risk detection and dispute evidence API",
    version="0.1.0",
)

# Wire empty routers
app.include_router(score.router)
app.include_router(payments.router)
app.include_router(webhooks.router)
app.include_router(disputes.router)
app.include_router(assistant.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

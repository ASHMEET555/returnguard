.PHONY: setup test train evaluate api web

setup:
	@echo "TODO: setup environment and dependencies"

test:
	@echo "TODO: run test suite"
	pytest

train:
	@echo "TODO: train baseline and XGBoost models"

evaluate:
	@echo "TODO: evaluate models on holdout test set"

api:
	@echo "TODO: run FastAPI development server"
	uvicorn api.main:app --reload

web:
	@echo "TODO: run Next.js development server"
	cd web && npm run dev

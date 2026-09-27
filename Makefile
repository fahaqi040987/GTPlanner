# GTPlanner Makefile - Simple Deployment Commands
# One command for every deployment task
# Author: GTPlanner Project
# Date: 2026-07-12

# Docker Compose Files
COMPOSE_DEV = docker-compose.dev.yml
COMPOSE_PROD = docker-compose.prod.yml
ENV_DEV = .env.dev
ENV_PROD = .env.prod

# Compose commands (each environment uses its own env file)
COMPOSE_DEV_CMD = docker-compose -f $(COMPOSE_DEV)
COMPOSE_PROD_CMD = docker-compose --env-file $(ENV_PROD) -f $(COMPOSE_PROD)

# Container Names
BACKEND_CONTAINER = gtplanner-backend-simple
FRONTEND_CONTAINER = gtplanner-frontend-simple
DB_CONTAINER = gtplanner-db-simple

# Colors for output
COLOR_RESET = \033[0m
COLOR_SUCCESS = \033[32m
COLOR_WARNING = \033[33m
COLOR_ERROR = \033[31m
COLOR_INFO = \033[36m

.PHONY: dev dev-build dev-stop dev-logs dev-logs-backend dev-logs-frontend dev-restart
.PHONY: dev-shell dev-psql
.PHONY: prod prod-deploy prod-build prod-logs prod-stop prod-restart
.PHONY: setup-dev setup-prod env-check
.PHONY: clean db-reset db-backup db-restore
.PHONY: logs ps test shell help

# Default target
.DEFAULT_GOAL := help


# =============================================
# DEVELOPMENT COMMANDS
# =============================================

dev: ## Start development environment (backend + frontend + db)
	@echo "$(COLOR_INFO)🚀 Starting GTPlanner development environment...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) up -d
	@echo "$(COLOR_SUCCESS)✅ Development environment started$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🌐 Frontend: http://localhost:8080$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🔧 Backend: http://localhost:11211$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🗄️  Database: localhost:5432$(COLOR_RESET)"

dev-build: ## Rebuild and start development environment
	@echo "$(COLOR_INFO)🔨 Rebuilding development containers...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) up -d --build
	@echo "$(COLOR_SUCCESS)✅ Development environment rebuilt and started$(COLOR_RESET)"

dev-stop: ## Stop development environment
	@echo "$(COLOR_WARNING)🛑 Stopping development environment...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) down
	@echo "$(COLOR_SUCCESS)✅ Development environment stopped$(COLOR_RESET)"

dev-restart: ## Restart development environment
	@echo "$(COLOR_INFO)🔄 Restarting development environment...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) restart
	@echo "$(COLOR_SUCCESS)✅ Development environment restarted$(COLOR_RESET)"


dev-logs: ## Show logs from all development services
	@echo "$(COLOR_INFO)📋 Showing development logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) logs -f

dev-logs-backend: ## Show backend logs only
	@echo "$(COLOR_INFO)📋 Backend logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) logs -f backend

dev-logs-frontend: ## Show frontend logs only
	@echo "$(COLOR_INFO)📋 Frontend logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) logs -f frontend


dev-shell: ## Open shell in backend container
	@echo "$(COLOR_INFO)🐚 Opening shell in backend container...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) exec backend /bin/bash

dev-psql: ## Open PostgreSQL shell
	@echo "$(COLOR_INFO)🗄️  Opening PostgreSQL shell...$(COLOR_RESET)"
	@docker-compose -f $(COMPOSE_DEV) exec db psql -U gtplanner gtplanner_db


# =============================================
# PRODUCTION COMMANDS
# =============================================

prod: ## Show production deployment instructions
	@echo "$(COLOR_INFO)📋 Production Deployment Instructions:$(COLOR_RESET)"
	@echo ""
	@echo "1. SSH into your VPS/server"
	@echo "2. Clone/pull latest code: git pull"
	@echo "3. Setup production environment: make setup-prod"
	@echo "4. Deploy: make prod-deploy"
	@echo "5. Verify: make prod-logs"

prod-deploy: ## Deploy production environment (build and start)
	@if [ ! -f $(ENV_PROD) ]; then \
		echo "$(COLOR_ERROR)❌ $(ENV_PROD) not found. Run: make setup-prod$(COLOR_RESET)"; \
		exit 1; \
	fi
	@echo "$(COLOR_INFO)🚀 Deploying GTPlanner production environment...$(COLOR_RESET)"
	@$(COMPOSE_PROD_CMD) up -d --build
	@echo "$(COLOR_SUCCESS)✅ Production environment deployed$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🌐 App (via nginx): https://localhost$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🔧 Backend: http://localhost:11211$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🖼️  Frontend (direct): http://localhost:3000$(COLOR_RESET)"

prod-build: ## Build production containers locally
	@echo "$(COLOR_INFO)🏗️  Building production containers...$(COLOR_RESET)"
	@$(COMPOSE_PROD_CMD) build
	@echo "$(COLOR_SUCCESS)✅ Production containers built$(COLOR_RESET)"

prod-logs: ## Show production log viewing instructions
	@echo "$(COLOR_INFO)📋 To view production logs on your VPS:$(COLOR_RESET)"
	@echo "$(COMPOSE_PROD_CMD) logs -f"

prod-stop: ## Stop production environment
	@echo "$(COLOR_WARNING)🛑 Stopping production environment...$(COLOR_RESET)"
	@$(COMPOSE_PROD_CMD) down
	@echo "$(COLOR_SUCCESS)✅ Production environment stopped$(COLOR_RESET)"

prod-restart: ## Restart production environment
	@echo "$(COLOR_INFO)🔄 Restarting production environment...$(COLOR_RESET)"
	@$(COMPOSE_PROD_CMD) restart
	@echo "$(COLOR_SUCCESS)✅ Production environment restarted$(COLOR_RESET)"


# =============================================
# ENVIRONMENT SETUP
# =============================================

setup-dev: ## Verify development environment configuration
	@echo "$(COLOR_INFO)🔧 Setting up development environment...$(COLOR_RESET)"
	@if [ -f $(ENV_DEV) ]; then \
		echo "$(COLOR_SUCCESS)✅ $(ENV_DEV) exists$(COLOR_RESET)"; \
		echo "$(COLOR_INFO)ℹ️  Edit $(ENV_DEV) with your dev API keys and configuration$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_ERROR)❌ $(ENV_DEV) not found. Create it from .env.example$(COLOR_RESET)"; \
		exit 1; \
	fi

setup-prod: ## Verify production environment configuration
	@echo "$(COLOR_INFO)🔧 Setting up production environment...$(COLOR_RESET)"
	@if [ -f $(ENV_PROD) ]; then \
		echo "$(COLOR_SUCCESS)✅ $(ENV_PROD) exists$(COLOR_RESET)"; \
		if grep -qE "change_this_password|your-api-key|your_api_key" $(ENV_PROD) 2>/dev/null; then \
			echo "$(COLOR_WARNING)⚠️  WARNING: $(ENV_PROD) contains placeholder values - edit them before deploying$(COLOR_RESET)"; \
		else \
			echo "$(COLOR_SUCCESS)✅ Production config looks ready$(COLOR_RESET)"; \
		fi; \
	else \
		echo "$(COLOR_ERROR)❌ $(ENV_PROD) not found. Create it from .env.example$(COLOR_RESET)"; \
		exit 1; \
	fi

env-check: ## Verify environment configuration
	@echo "$(COLOR_INFO)🔍 Checking environment configuration...$(COLOR_RESET)"
	@if [ -f $(ENV_DEV) ]; then \
		echo "$(COLOR_SUCCESS)✅ $(ENV_DEV) exists$(COLOR_RESET)"; \
		if grep -q "your-dev-api-key" $(ENV_DEV) 2>/dev/null; then \
			echo "$(COLOR_WARNING)⚠️  WARNING: $(ENV_DEV) contains placeholder API key$(COLOR_RESET)"; \
		else \
			echo "$(COLOR_SUCCESS)✅ Dev API keys configured$(COLOR_RESET)"; \
		fi \
	else \
		echo "$(COLOR_WARNING)⚠️  $(ENV_DEV) not found. Run: make setup-dev$(COLOR_RESET)"; \
	fi
	@if [ -f $(ENV_PROD) ]; then \
		echo "$(COLOR_SUCCESS)✅ $(ENV_PROD) exists$(COLOR_RESET)"; \
		if grep -q "your-api-key-here" $(ENV_PROD) 2>/dev/null; then \
			echo "$(COLOR_WARNING)⚠️  WARNING: $(ENV_PROD) contains placeholders$(COLOR_RESET)"; \
		else \
			echo "$(COLOR_SUCCESS)✅ Production config ready$(COLOR_RESET)"; \
		fi \
	else \
		echo "$(COLOR_INFO)ℹ️  $(ENV_PROD) not found (only needed for production)$(COLOR_RESET)"; \
	fi


# =============================================
# DATABASE OPERATIONS
# =============================================

db-reset: ## Reset development database (⚠️  deletes all data)
	@echo "$(COLOR_WARNING)⚠️  WARNING: This will delete all development data!$(COLOR_RESET)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(COLOR_INFO)🗑️  Resetting development database...$(COLOR_RESET)"; \
		docker-compose -f $(COMPOSE_DEV) down -v; \
		docker-compose -f $(COMPOSE_DEV) up -d db; \
		sleep 5; \
		echo "$(COLOR_SUCCESS)✅ Development database reset$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_ERROR)❌ Cancelled$(COLOR_RESET)"; \
	fi

db-backup: ## Backup production database (run on production server)
	@echo "$(COLOR_INFO)💾 To backup production database on your VPS:$(COLOR_RESET)"
	@echo "$(COMPOSE_PROD_CMD) exec db pg_dump -U gtplanner gtplanner_db > backup_$$(date +%Y%m%d).sql"

db-restore: ## Show database restore instructions
	@echo "$(COLOR_INFO)📋 To restore a backup:$(COLOR_RESET)"
	@echo "$(COMPOSE_DEV_CMD) exec -T db psql -U gtplanner gtplanner_db < backup_file.sql"


# =============================================
# UTILITIES
# =============================================

clean: ## Stop and remove all containers and volumes
	@echo "$(COLOR_INFO)🧹 Cleaning up all containers and volumes...$(COLOR_RESET)"
	@$(COMPOSE_DEV_CMD) down -v
	@-$(COMPOSE_PROD_CMD) down -v 2>/dev/null || true
	@echo "$(COLOR_SUCCESS)✅ All containers and volumes removed$(COLOR_RESET)"

logs: ## Show logs from all running services
	@echo "$(COLOR_INFO)📋 Running containers:$(COLOR_RESET)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v "NAMES"
	@echo ""
	@read -p "Enter container name to view logs (or Ctrl+C to cancel): " container; \
	docker logs -f "$$container"

ps: ## Show running containers status
	@echo "$(COLOR_INFO)📋 Running containers:$(COLOR_RESET)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

test: ## Run backend tests
	@echo "$(COLOR_INFO)🧪 Running backend tests...$(COLOR_RESET)"
	@$(COMPOSE_DEV_CMD) exec backend pytest -v

shell: ## Open shell in backend container (alias for dev-shell)
	@echo "$(COLOR_INFO)🐚 Opening shell in backend container...$(COLOR_RESET)"
	@$(COMPOSE_DEV_CMD) exec backend /bin/bash


help: ## Show this help message
	@echo "$(COLOR_INFO)📋 GTPlanner Makefile Commands:$(COLOR_RESET)"
	@echo ""
	@grep -E '^[a-z_-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/.*## //' | sort | column -t -s '#'
	@echo ""
	@echo "$(COLOR_INFO)Development Commands:$(COLOR_RESET)"
	@echo "  make dev              Start development environment"
	@echo "  make dev-build        Rebuild and start development"
	@echo "  make dev-stop         Stop development environment"
	@echo "  make dev-logs         Show all logs"
	@echo "  make dev-restart      Restart services"
	@echo ""
	@echo "$(COLOR_INFO)Production Commands:$(COLOR_RESET)"
	@echo "  make prod             Show deployment instructions"
	@echo "  make prod-deploy      Deploy production environment"
	@echo "  make prod-build       Build production containers"
	@echo "  make prod-stop        Stop production environment"
	@echo ""
	@echo "$(COLOR_INFO)Environment Setup:$(COLOR_RESET)"
	@echo "  make setup-dev        Setup development environment"
	@echo "  make setup-prod       Setup production environment"
	@echo "  make env-check        Check environment configuration"
	@echo ""
	@echo "$(COLOR_INFO)Database Operations:$(COLOR_RESET)"
	@echo "  make db-reset         Reset development database"
	@echo "  make db-backup        Backup production database"
	@echo ""
	@echo "$(COLOR_INFO)Utilities:$(COLOR_RESET)"
	@echo "  make clean            Stop and remove all containers"
	@echo "  make logs             View logs from running containers"
	@	@echo "  make ps               Show running containers"
	@echo "  make test             Run backend tests"
	@echo "  make help             Show this help message"
	@echo ""
	@echo "$(COLOR_INFO)For detailed command descriptions: make help$(COLOR_RESET)"


# GTPlanner Makefile - Simple Deployment Commands
# One command for every deployment task
# Author: GTPlanner Project
# Date: 2026-07-12

# Docker Compose Files
COMPOSE_DEV = docker-compose.dev.yml
COMPOSE_PROD = docker-compose.prod.yml

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
.PHONY: prod prod-build prod-logs prod-stop prod-restart
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
	@docker compose -f $(COMPOSE_DEV) up -d
	@echo "$(COLOR_SUCCESS)✅ Development environment started$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🌐 Frontend: http://localhost:8080$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🔧 Backend: http://localhost:11211$(COLOR_RESET)"
	@echo "$(COLOR_INFO)🗄️  Database: localhost:5432$(COLOR_RESET)"

dev-build: ## Rebuild and start development environment
	@echo "$(COLOR_INFO)🔨 Rebuilding development containers...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) up -d --build
	@echo "$(COLOR_SUCCESS)✅ Development environment rebuilt and started$(COLOR_RESET)"

dev-stop: ## Stop development environment
	@echo "$(COLOR_WARNING)🛑 Stopping development environment...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) down
	@echo "$(COLOR_SUCCESS)✅ Development environment stopped$(COLOR_RESET)"

dev-restart: ## Restart development environment
	@echo "$(COLOR_INFO)🔄 Restarting development environment...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) restart
	@echo "$(COLOR_SUCCESS)✅ Development environment restarted$(COLOR_RESET)"


dev-logs: ## Show logs from all development services
	@echo "$(COLOR_INFO)📋 Showing development logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) logs -f

dev-logs-backend: ## Show backend logs only
	@echo "$(COLOR_INFO)📋 Backend logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) logs -f backend

dev-logs-frontend: ## Show frontend logs only
	@echo "$(COLOR_INFO)📋 Frontend logs (Ctrl+C to exit)...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) logs -f frontend


dev-shell: ## Open shell in backend container
	@echo "$(COLOR_INFO)🐚 Opening shell in backend container...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) exec backend /bin/bash

dev-psql: ## Open PostgreSQL shell
	@echo "$(COLOR_INFO)🗄️  Opening PostgreSQL shell...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) exec db psql -U gtplanner gtplanner_db


# =============================================
# PRODUCTION COMMANDS
# =============================================

prod: ## Show production deployment instructions
	@echo "$(COLOR_INFO)📋 Production Deployment Instructions:$(COLOR_RESET)"
	@echo ""
	@echo "1. SSH into your VPS/server"
	@echo "2. Clone/pull latest code: git pull"
	@echo "3. Setup production environment: make setup-prod"
	@echo "4. Deploy: docker compose -f $(COMPOSE_PROD) up -d --build"
	@echo "5. Verify: docker compose -f $(COMPOSE_PROD) logs -f"

prod-build: ## Build production containers locally
	@echo "$(COLOR_INFO)🏗️  Building production containers...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_PROD) build
	@echo "$(COLOR_SUCCESS)✅ Production containers built$(COLOR_RESET)"

prod-logs: ## Show production log viewing instructions
	@echo "$(COLOR_INFO)📋 To view production logs on your VPS:$(COLOR_RESET)"
	@echo "docker compose -f $(COMPOSE_PROD) logs -f"

prod-stop: ## Show production stop instructions
	@echo "$(COLOR_INFO)📋 To stop production on your VPS:$(COLOR_RESET)"
	@echo "docker compose -f $(COMPOSE_PROD) down"

prod-restart: ## Show production restart instructions
	@echo "$(COLOR_INFO)📋 To restart production on your VPS:$(COLOR_RESET)"
	@echo "docker compose -f $(COMPOSE_PROD) restart"


# =============================================
# ENVIRONMENT SETUP
# =============================================

setup-dev: ## Create development environment files
	@echo "$(COLOR_INFO)🔧 Setting up development environment...$(COLOR_RESET)"
	@if [ ! -f .env.local ]; then \
		cp .env.dev .env.local; \
		echo "$(COLOR_SUCCESS)✅ Created .env.local from template$(COLOR_RESET)"; \
		echo "$(COLOR_WARNING)⚠️  Edit .env.local with your API keys and configuration$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_SUCCESS)✅ .env.local already exists$(COLOR_RESET)"; \
	fi

setup-prod: ## Create production environment files
	@echo "$(COLOR_INFO)🔧 Setting up production environment...$(COLOR_RESET)"
	@if [ ! -f .env.production ]; then \
		cp .env.prod .env.production; \
		echo "$(COLOR_SUCCESS)✅ Created .env.production from template$(COLOR_RESET)"; \
		echo "$(COLOR_WARNING)⚠️  Edit .env.production with production values$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_SUCCESS)✅ .env.production already exists$(COLOR_RESET)"; \
	fi

env-check: ## Verify environment configuration
	@echo "$(COLOR_INFO)🔍 Checking environment configuration...$(COLOR_RESET)"
	@if [ -f .env.local ]; then \
		echo "$(COLOR_SUCCESS)✅ .env.local exists$(COLOR_RESET)"; \
		if grep -q "your-dev-api-key" .env.local 2>/dev/null; then \
			echo "$(COLOR_WARNING)⚠️  WARNING: .env.local contains placeholder API key$(COLOR_RESET)"; \
		else \
			echo "$(COLOR_SUCCESS)✅ API keys configured$(COLOR_RESET)"; \
		fi \
	else \
		echo "$(COLOR_WARNING)⚠️  .env.local not found. Run: make setup-dev$(COLOR_RESET)"; \
	fi
	@if [ -f .env.production ]; then \
		echo "$(COLOR_SUCCESS)✅ .env.production exists$(COLOR_RESET)"; \
		if grep -q "your-api-key-here" .env.production 2>/dev/null; then \
			echo "$(COLOR_WARNING)⚠️  WARNING: .env.production contains placeholders$(COLOR_RESET)"; \
		else \
			echo "$(COLOR_SUCCESS)✅ Production config ready$(COLOR_RESET)"; \
		fi \
	else \
		echo "$(COLOR_INFO)ℹ️  .env.production not found (only needed for production)$(COLOR_RESET)"; \
	fi


# =============================================
# DATABASE OPERATIONS
# =============================================

db-reset: ## Reset development database (⚠️  deletes all data)
	@echo "$(COLOR_WARNING)⚠️  WARNING: This will delete all development data!$(COLOR_RESET)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(COLOR_INFO)🗑️  Resetting development database...$(COLOR_RESET)"; \
		docker compose -f $(COMPOSE_DEV) down -v; \
		docker compose -f $(COMPOSE_DEV) up -d db; \
		sleep 5; \
		echo "$(COLOR_SUCCESS)✅ Development database reset$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_ERROR)❌ Cancelled$(COLOR_RESET)"; \
	fi

db-backup: ## Backup production database (run on production server)
	@echo "$(COLOR_INFO)💾 To backup production database on your VPS:$(COLOR_RESET)"
	@echo "docker compose -f $(COMPOSE_PROD) exec db pg_dump -U gtplanner gtplanner_db > backup_$$(date +%Y%m%d).sql"

db-restore: ## Show database restore instructions
	@echo "$(COLOR_INFO)📋 To restore a backup:$(COLOR_RESET)"
	@echo "docker compose -f $(COMPOSE_DEV) exec -T db psql -U gtplanner gtplanner_db < backup_file.sql"


# =============================================
# UTILITIES
# =============================================

clean: ## Stop and remove all containers and volumes
	@echo "$(COLOR_INFO)🧹 Cleaning up all containers and volumes...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) down -v
	@-docker compose -f $(COMPOSE_PROD) down -v 2>/dev/null || true
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
	@docker compose -f $(COMPOSE_DEV) exec backend pytest -v

shell: ## Open shell in backend container (alias for dev-shell)
	@echo "$(COLOR_INFO)🐚 Opening shell in backend container...$(COLOR_RESET)"
	@docker compose -f $(COMPOSE_DEV) exec backend /bin/bash


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
	@echo "  make prod-build       Build production containers"
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


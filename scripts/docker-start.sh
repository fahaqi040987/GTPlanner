#!/bin/bash

# GTPlanner Docker Startup Script
# This script helps manage Docker containers for development and production

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message "${RED}" "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_message "${GREEN}" "✓ Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        if ! docker compose version > /dev/null 2>&1; then
            print_message "${RED}" "Docker Compose is not available. Please install Docker Compose."
            exit 1
        else
            DOCKER_COMPOSE="docker compose"
        fi
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    print_message "${GREEN}" "✓ Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    print_message "${BLUE}" "Creating necessary directories..."
    mkdir -p database/init database/backups logs nginx/ssl
    print_message "${GREEN}" "✓ Directories created"
}

# Function to generate SSL certificates for development
generate_ssl_certs() {
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        print_message "${YELLOW}" "Generating self-signed SSL certificates for development..."
        openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_message "${GREEN}" "✓ SSL certificates generated"
    else
        print_message "${GREEN}" "✓ SSL certificates already exist"
    fi
}

# Function to start development environment
start_dev() {
    print_message "${BLUE}" "Starting GTPlanner in development mode..."
    check_docker
    check_docker_compose
    create_directories

    print_message "${YELLOW}" "Building and starting containers..."
    $DOCKER_COMPOSE -f docker-compose.yml up -d --build

    print_message "${GREEN}" "✓ Development environment started!"
    echo ""
    print_message "${BLUE}" "Services available at:"
    echo "  • Frontend (Vite Dev Server): http://localhost:5173"
    echo "  • Backend (FastAPI): http://localhost:11211"
    echo "  • Nginx (Reverse Proxy): http://localhost:8080"
    echo "  • API Docs: http://localhost:11211/docs"
    echo ""
    print_message "${YELLOW}" "To view logs: $DOCKER_COMPOSE -f docker-compose.yml logs -f"
    print_message "${YELLOW}" "To stop: $DOCKER_COMPOSE -f docker-compose.yml down"
}

# Function to start production environment
start_prod() {
    print_message "${BLUE}" "Starting GTPlanner in production mode..."
    check_docker
    check_docker_compose
    create_directories
    generate_ssl_certs

    # Check if .env.prod exists
    if [ ! -f .env.prod ]; then
        print_message "${RED}" ".env.prod file not found. Please create it with production environment variables."
        exit 1
    fi

    print_message "${YELLOW}" "Building and starting production containers..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml --env-file .env.prod up -d --build

    print_message "${GREEN}" "✓ Production environment started!"
    echo ""
    print_message "${BLUE}" "Services available at:"
    echo "  • Frontend: http://localhost:3000"
    echo "  • Backend: http://localhost:11211"
    echo "  • Nginx (SSL): https://localhost"
    echo ""
    print_message "${YELLOW}" "To view logs: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
    print_message "${YELLOW}" "To stop: $DOCKER_COMPOSE -f docker-compose.prod.yml down"
}

# Function to stop containers
stop() {
    print_message "${BLUE}" "Stopping GTPlanner containers..."
    check_docker_compose

    if [ -f docker-compose.yml ]; then
        $DOCKER_COMPOSE -f docker-compose.yml down
    fi

    if [ -f docker-compose.prod.yml ]; then
        $DOCKER_COMPOSE -f docker-compose.prod.yml down
    fi

    print_message "${GREEN}" "✓ Containers stopped"
}

# Function to show logs
logs() {
    check_docker_compose
    print_message "${BLUE}" "Showing logs (Ctrl+C to exit)..."
    $DOCKER_COMPOSE -f docker-compose.yml logs -f
}

# Function to restart containers
restart() {
    print_message "${BLUE}" "Restarting GTPlanner containers..."
    stop
    start_dev
}

# Function to clean everything (WARNING: removes volumes)
clean() {
    print_message "${RED}" "WARNING: This will remove all containers, volumes, and data!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        check_docker_compose
        print_message "${YELLOW}" "Removing containers and volumes..."
        $DOCKER_COMPOSE -f docker-compose.yml down -v
        $DOCKER_COMPOSE -f docker-compose.prod.yml down -v
        print_message "${GREEN}" "✓ Cleanup complete"
    else
        print_message "${YELLOW}" "Cleanup cancelled"
    fi
}

# Function to show status
status() {
    check_docker_compose
    print_message "${BLUE}" "GTPlanner container status:"
    $DOCKER_COMPOSE -f docker-compose.yml ps
}

# Main script logic
case "${1:-}" in
    start-dev)
        start_dev
        ;;
    start-prod)
        start_prod
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    *)
        echo "GTPlanner Docker Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start-dev    Start development environment"
        echo "  start-prod   Start production environment"
        echo "  stop         Stop all containers"
        echo "  restart      Restart development environment"
        echo "  logs         Show container logs"
        echo "  status       Show container status"
        echo "  clean        Remove all containers and volumes (WARNING: deletes data)"
        echo ""
        ;;
esac
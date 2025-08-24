#!/bin/bash

# Docker build and run script for where-am-i application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build the production image
build_production() {
    print_status "Building production Docker image..."
    docker build -t where-am-i:latest .
    print_success "Production image built successfully!"
}

# Function to build the development image
build_development() {
    print_status "Building development Docker image..."
    docker build -f Dockerfile.dev -t where-am-i:dev .
    print_success "Development image built successfully!"
}

# Function to run the production container
run_production() {
    print_status "Starting production container..."
    docker-compose up -d
    print_success "Production container started!"
    print_status "Frontend: http://localhost:5173"
    print_status "API: http://localhost:8787"
}

# Function to run the development container
run_development() {
    print_status "Starting development container..."
    docker-compose --profile dev up -d
    print_success "Development container started!"
    print_status "Frontend: http://localhost:3000"
    print_status "API: http://localhost:3001"
}

# Function to stop containers
stop_containers() {
    print_status "Stopping containers..."
    docker-compose down
    print_success "Containers stopped!"
}

# Function to view logs
view_logs() {
    print_status "Showing container logs..."
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build production Docker image"
    echo "  build:dev   Build development Docker image"
    echo "  run         Run production container"
    echo "  run:dev     Run development container"
    echo "  stop        Stop all containers"
    echo "  logs        View container logs"
    echo "  cleanup     Clean up Docker resources"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 run     # Build and run production"
    echo "  $0 build:dev && $0 run:dev  # Build and run development"
    echo "  $0 stop                # Stop containers"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        "build")
            build_production
            ;;
        "build:dev")
            build_development
            ;;
        "run")
            run_production
            ;;
        "run:dev")
            run_development
            ;;
        "stop")
            stop_containers
            ;;
        "logs")
            view_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"

.PHONY: help build build-dev run run-dev stop logs clean docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  make build      - Build production Docker image"
	@echo "  make build-dev  - Build development Docker image"
	@echo "  make run        - Run production container"
	@echo "  make run-dev    - Run development container"
	@echo "  make stop       - Stop all containers"
	@echo "  make logs       - View container logs"
	@echo "  make clean      - Clean up Docker resources"
	@echo "  make docker-build - Build both images"
	@echo "  make docker-run   - Run production container"

# Build production image
build:
	@echo "Building production Docker image..."
	docker build -t where-am-i:latest .
	@echo "Production image built successfully!"

# Build development image
build-dev:
	@echo "Building development Docker image..."
	docker build -f Dockerfile.dev -t where-am-i:dev .
	@echo "Development image built successfully!"

# Run production container
run:
	@echo "Starting production container..."
	docker-compose up -d
	@echo "Production container started!"
	@echo "Frontend: http://localhost:5173"
	@echo "API: http://localhost:8787"

# Run development container
run-dev:
	@echo "Starting development container..."
	docker-compose --profile dev up -d
	@echo "Development container started!"
	@echo "Frontend: http://localhost:3000"
	@echo "API: http://localhost:3001"

# Stop containers
stop:
	@echo "Stopping containers..."
	docker-compose down
	@echo "Containers stopped!"

# View logs
logs:
	@echo "Showing container logs..."
	docker-compose logs -f

# Clean up Docker resources
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup completed!"

# Build both images
docker-build: build build-dev

# Run production container (alias for run)
docker-run: run

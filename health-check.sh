#!/bin/bash

# Health check script for where-am-i application

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

# Function to check if a service is responding
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    print_status "Checking $name at $url..."
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
            print_success "$name is responding correctly"
            return 0
        else
            print_error "$name is not responding correctly"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget -q --spider "$url" 2>/dev/null; then
            print_success "$name is responding correctly"
            return 0
        else
            print_error "$name is not responding correctly"
            return 1
        fi
    else
        print_warning "Neither curl nor wget found, cannot check $name"
        return 1
    fi
}

# Function to check if Docker containers are running
check_containers() {
    print_status "Checking Docker containers..."
    
    if ! docker ps | grep -q "where-am-i"; then
        print_error "No where-am-i containers are running"
        print_status "Start containers with: ./docker-build.sh run"
        return 1
    fi
    
    print_success "Docker containers are running"
    docker ps --filter "name=where-am-i" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Function to check ports
check_ports() {
    print_status "Checking if ports are accessible..."
    
    # Check if ports are in use
    if lsof -i :5173 >/dev/null 2>&1; then
        print_success "Port 5173 (frontend) is accessible"
    else
        print_error "Port 5173 (frontend) is not accessible"
    fi
    
    if lsof -i :8787 >/dev/null 2>&1; then
        print_success "Port 8787 (API) is accessible"
    else
        print_error "Port 8787 (API) is not accessible"
    fi
}

# Main health check
main() {
    echo "🏥 Health Check for Where Am I Application"
    echo "=========================================="
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check containers
    if ! check_containers; then
        exit 1
    fi
    
    # Check ports
    check_ports
    
    echo ""
    print_status "Testing application endpoints..."
    
    # Check frontend
    if check_service "Frontend" "http://localhost:5173"; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
    fi
    
    # Check API health endpoint
    if check_service "API Health" "http://localhost:8787/api/health"; then
        print_success "API health endpoint is responding"
    else
        print_error "API health endpoint check failed"
    fi
    
    # Check API reverse geocoding endpoint
    if check_service "API Reverse Geocoding" "http://localhost:8787/api/reverse?lat=40.7128&lon=-74.0060"; then
        print_success "API reverse geocoding endpoint is responding"
    else
        print_error "API reverse geocoding endpoint check failed"
    fi
    
    echo ""
    print_status "Health check completed!"
    
    # Summary
    echo ""
    echo "📋 Summary:"
    echo "Frontend: http://localhost:5173"
    echo "API: http://localhost:8787"
    echo "API Health: http://localhost:8787/api/health"
    echo "API Test: http://localhost:8787/api/reverse?lat=40.7128&lon=-74.0060"
}

# Run main function
main "$@"

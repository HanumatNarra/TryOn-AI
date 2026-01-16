#!/bin/bash

# TryOn.AI Production Deployment Script
# This script handles the complete deployment process for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="tryon-ai"
BACKEND_PORT=8000
FRONTEND_PORT=5173
DOCKER_REGISTRY="your-registry.com"  # Change this to your registry

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        error ".env file not found. Please create .env file with required environment variables."
    fi
    
    # Check if Node.js is installed (for frontend build)
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
    fi
    
    success "Prerequisites check passed"
}

# Build backend
build_backend() {
    log "Building backend Docker image..."

    # Build the backend image
    docker build -t ${PROJECT_NAME}-backend:latest ./backend || error "Backend build failed"

    success "Backend build completed"
}

# Build frontend
build_frontend() {
    log "Building frontend..."

    cd frontend || error "Frontend directory not found"

    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci --only=production || error "Frontend dependency installation failed"

    # Build the application
    log "Building frontend application..."
    npm run build || error "Frontend build failed"

    # Build Docker image
    log "Building frontend Docker image..."
    docker build -t ${PROJECT_NAME}-frontend:latest . || error "Frontend Docker build failed"

    cd ..
    success "Frontend build completed"
}

# Run security checks
security_checks() {
    log "Running security checks..."

    # Check for vulnerabilities in dependencies
    cd frontend
    if npm audit --audit-level moderate; then
        warning "Security vulnerabilities found in frontend dependencies"
    else
        success "Frontend security check passed"
    fi
    cd ..
    
    # Check for secrets in code
    if grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git; then
        error "Potential API keys found in code. Please remove them before deployment."
    fi
    
    success "Security checks completed"
}

# Deploy with Docker Compose
deploy() {
    log "Deploying application..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down || true
    
    # Pull latest images (if using external registry)
    if [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        log "Pulling latest images..."
        docker-compose pull || warning "Failed to pull images"
    fi
    
    # Start services
    log "Starting services..."
    docker-compose up -d || error "Deployment failed"
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    if curl -f http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
    
    success "Deployment completed successfully"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current containers
    docker-compose down
    
    # Start previous version (if available)
    if docker images | grep -q "${PROJECT_NAME}-backend:previous"; then
        docker tag ${PROJECT_NAME}-backend:previous ${PROJECT_NAME}-backend:latest
        docker tag ${PROJECT_NAME}-frontend:previous ${PROJECT_NAME}-frontend:latest
        docker-compose up -d
        success "Rollback completed"
    else
        error "No previous version available for rollback"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting TryOn.AI deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Security checks
    security_checks
    
    # Backup current images
    if docker images | grep -q "${PROJECT_NAME}-backend:latest"; then
        log "Backing up current images..."
        docker tag ${PROJECT_NAME}-backend:latest ${PROJECT_NAME}-backend:previous || true
        docker tag ${PROJECT_NAME}-frontend:latest ${PROJECT_NAME}-frontend:previous || true
    fi
    
    # Build applications
    build_backend
    build_frontend
    
    # Deploy
    deploy
    
    # Cleanup
    cleanup
    
    success "Deployment completed successfully!"
    log "Application is available at:"
    log "  Frontend: http://localhost:${FRONTEND_PORT}"
    log "  Backend API: http://localhost:${BACKEND_PORT}"
    log "  API Documentation: http://localhost:${BACKEND_PORT}/docs"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "build")
        check_prerequisites
        build_backend
        build_frontend
        success "Build completed"
        ;;
    "security")
        security_checks
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|build|security|cleanup}"
        echo "  deploy   - Full deployment (default)"
        echo "  rollback - Rollback to previous version"
        echo "  build    - Build images only"
        echo "  security - Run security checks only"
        echo "  cleanup  - Clean up Docker resources"
        exit 1
        ;;
esac

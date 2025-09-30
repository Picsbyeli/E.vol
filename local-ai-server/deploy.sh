#!/bin/bash

# DeepSeek-V3 Local Deployment Script
# Automated setup and deployment for E.Vol gaming platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="deepseek-v3-local"
MODELS_DIR="./models"
LOGS_DIR="./logs"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check NVIDIA Docker runtime
    if ! docker run --rm --gpus all nvidia/cuda:12.1-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        log_warning "NVIDIA Docker runtime not properly configured. GPU support may not work."
    fi
    
    log_success "Prerequisites check completed"
}

# Setup directories
setup_directories() {
    log_info "Setting up directories..."
    
    mkdir -p "$MODELS_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "monitoring/grafana/dashboards"
    mkdir -p "monitoring/grafana/datasources"
    
    log_success "Directories created"
}

# Check system requirements
check_system() {
    log_info "Checking system requirements..."
    
    if [ -f "system_checker.py" ]; then
        python3 system_checker.py --quiet
    else
        log_warning "System checker not found. Skipping system validation."
    fi
}

# Setup environment file
setup_environment() {
    if [ ! -f ".env" ]; then
        log_info "Creating environment file..."
        cat > .env << EOF
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Model Configuration
DEEPSEEK_MODEL_PATH=/app/models/deepseek-v3-fp8

# Server Configuration
AI_SERVER_PORT=8000

# Monitoring Configuration
GRAFANA_PASSWORD=admin123

# GPU Configuration
CUDA_VISIBLE_DEVICES=all
EOF
        log_warning "Please edit .env file with your configuration"
    fi
}

# Download models
download_models() {
    log_info "Checking for model weights..."
    
    if [ ! -d "$MODELS_DIR/deepseek-v3-fp8" ] && [ ! -d "$MODELS_DIR/deepseek-v3-base" ]; then
        log_warning "No model weights found."
        echo "To download models, run:"
        echo "  python3 model_manager.py download deepseek-v3-fp8 --hf-token YOUR_TOKEN"
        echo ""
        echo "Or use the DeepSeek API fallback by setting DEEPSEEK_API_KEY in .env"
    else
        log_success "Model weights found"
    fi
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build development image
    docker-compose build deepseek-dev
    
    log_success "Docker images built"
}

# Deploy development environment
deploy_dev() {
    log_info "Deploying development environment..."
    
    docker-compose up -d deepseek-dev
    
    # Wait for service to be ready
    log_info "Waiting for service to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            log_success "Development environment deployed successfully"
            echo ""
            echo "🚀 Services are running:"
            echo "  - AI Server: http://localhost:8000"
            echo "  - Health Check: http://localhost:8000/health"
            echo "  - API Docs: http://localhost:8000/docs"
            echo "  - Jupyter Notebook: http://localhost:8888"
            return 0
        fi
        sleep 2
    done
    
    log_error "Service failed to start properly"
    docker-compose logs deepseek-dev
    return 1
}

# Deploy production environment
deploy_prod() {
    log_info "Deploying production environment..."
    
    docker-compose --profile production up -d
    
    log_success "Production environment deployed"
    echo ""
    echo "🚀 Production services:"
    echo "  - AI Server: http://localhost:8001"
    echo "  - Redis Cache: localhost:6379"
}

# Deploy SGLang optimized
deploy_sglang() {
    log_info "Deploying SGLang optimized environment..."
    
    if [ ! -d "$MODELS_DIR/deepseek-v3-fp8" ]; then
        log_error "DeepSeek-V3 FP8 model weights required for SGLang deployment"
        exit 1
    fi
    
    docker-compose --profile sglang up -d
    
    log_success "SGLang environment deployed"
    echo ""
    echo "🚀 SGLang optimized server: http://localhost:8002"
}

# Deploy monitoring
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Create monitoring configuration
    mkdir -p monitoring
    
    # Prometheus config
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'deepseek-ai-server'
    static_configs:
      - targets: ['deepseek-prod:8000', 'deepseek-sglang:8000']
  
  - job_name: 'dcgm-exporter'
    static_configs:
      - targets: ['dcgm-exporter:9400']
EOF
    
    docker-compose --profile monitoring up -d
    
    log_success "Monitoring deployed"
    echo ""
    echo "📊 Monitoring services:"
    echo "  - Grafana: http://localhost:3001 (admin/admin123)"
    echo "  - Prometheus: http://localhost:9090"
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    
    docker-compose down
    
    log_success "All services stopped"
}

# Clean up
cleanup() {
    log_info "Cleaning up..."
    
    docker-compose down -v --remove-orphans
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Show status
show_status() {
    echo ""
    echo "📋 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🖥️  System Resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Show logs
show_logs() {
    local service=${1:-"deepseek-dev"}
    docker-compose logs -f "$service"
}

# Main menu
show_help() {
    echo "DeepSeek-V3 Local Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup              - Initial setup (prerequisites, directories, environment)"
    echo "  check              - Check system requirements"
    echo "  build              - Build Docker images"
    echo "  dev                - Deploy development environment"
    echo "  prod               - Deploy production environment"
    echo "  sglang             - Deploy SGLang optimized environment"
    echo "  monitoring         - Deploy monitoring stack"
    echo "  stop               - Stop all services"
    echo "  status             - Show service status"
    echo "  logs [service]     - Show logs for service"
    echo "  cleanup            - Clean up all resources"
    echo "  help               - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup           # Initial setup"
    echo "  $0 dev             # Start development environment"
    echo "  $0 logs deepseek-dev  # Show development logs"
}

# Main script
main() {
    case "${1:-help}" in
        setup)
            check_prerequisites
            setup_directories
            setup_environment
            download_models
            log_success "Setup completed. Edit .env file and run '$0 dev' to start."
            ;;
        check)
            check_system
            ;;
        build)
            build_images
            ;;
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        sglang)
            deploy_sglang
            ;;
        monitoring)
            deploy_monitoring
            ;;
        stop)
            stop_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
# DeepSeek-V3 Local Deployment Guide for E.Vol Gaming Platform

This guide provides comprehensive instructions for deploying DeepSeek-V3 locally to power your E.Vol gaming platform with AI-generated content.

## 🎯 Overview

The local deployment setup includes:
- **FastAPI inference server** with local model support and API fallback
- **Model weight management** for FP8/BF16 DeepSeek-V3 models
- **System requirements validation** and hardware optimization
- **Docker containerization** for scalable deployment
- **Performance monitoring** with real-time metrics
- **Automatic fallback** to DeepSeek API when local server unavailable

## 📋 Prerequisites

### Hardware Requirements

#### Minimum (FP8 Inference)
- **GPU**: 1x NVIDIA GPU with 40GB+ VRAM (A100, H100, RTX 4090)
- **RAM**: 32GB system memory
- **Storage**: 400GB free space
- **CPU**: 8+ cores recommended

#### Recommended (BF16 Inference)
- **GPU**: 2x NVIDIA GPU with 80GB+ VRAM each
- **RAM**: 64GB+ system memory
- **Storage**: 1.4TB free space
- **CPU**: 16+ cores

### Software Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Python**: 3.8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **NVIDIA Docker Runtime**: For GPU support
- **CUDA**: 12.1+

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to your E.Vol project
cd /path/to/E.vol

# The local-ai-server directory should already exist
cd local-ai-server

# Make deployment script executable
chmod +x deploy.sh

# Run initial setup
./deploy.sh setup
```

### 2. Configure Environment

Edit the `.env` file created during setup:

```bash
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Model Configuration (will be set after downloading models)
DEEPSEEK_MODEL_PATH=/app/models/deepseek-v3-fp8

# Server Configuration
AI_SERVER_PORT=8000

# Monitoring Configuration
GRAFANA_PASSWORD=your_secure_password

# GPU Configuration
CUDA_VISIBLE_DEVICES=all
```

### 3. Check System Requirements

```bash
# Validate your system can run DeepSeek-V3
python3 system_checker.py

# For quiet mode (just compatibility status)
python3 system_checker.py --quiet

# Check specific precision requirements
python3 system_checker.py --precision fp8
python3 system_checker.py --precision bf16
```

### 4. Download Model Weights (Optional)

**Option A: Download DeepSeek-V3 FP8 (Recommended)**
```bash
# List available models
python3 model_manager.py list

# Download FP8 model (350GB)
python3 model_manager.py download deepseek-v3-fp8 --hf-token YOUR_HF_TOKEN

# Prepare for inference
python3 model_manager.py prepare deepseek-v3-fp8

# Set as active model
python3 model_manager.py set-active deepseek-v3-fp8
```

**Option B: Use API Fallback Only**
- Skip model download and rely on DeepSeek API
- Ensure `DEEPSEEK_API_KEY` is configured in `.env`

### 5. Deploy Development Environment

```bash
# Start development server
./deploy.sh dev

# The server will be available at:
# - AI Server: http://localhost:8000
# - API Documentation: http://localhost:8000/docs
# - Health Check: http://localhost:8000/health
```

### 6. Update E.Vol Configuration

Add to your E.Vol `.env` file:

```bash
# Local AI Server Configuration
VITE_LOCAL_AI_URL=http://localhost:8000
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
```

## 🔧 Deployment Options

### Development Mode
```bash
./deploy.sh dev
```
- Single container with hot reload
- Jupyter notebook access on port 8888
- Ideal for development and testing

### Production Mode
```bash
./deploy.sh prod
```
- Optimized container with health checks
- Redis caching enabled
- Automatic restart policies
- Production-ready configuration

### SGLang Optimized Mode
```bash
./deploy.sh sglang
```
- High-performance inference with SGLang
- FP8 optimization enabled
- Multi-GPU tensor parallelism
- Best performance for production

### Monitoring Stack
```bash
./deploy.sh monitoring
```
- Grafana dashboards on port 3001
- Prometheus metrics on port 9090
- GPU monitoring with DCGM
- System resource tracking

## 📊 Performance Optimization

### Model Selection Guide

| Model | Size | VRAM Req. | Speed | Quality | Use Case |
|-------|------|-----------|-------|---------|----------|
| DeepSeek-V3-FP8 | 350GB | 80GB | Fast | High | Recommended |
| DeepSeek-V3-Base | 1.3TB | 160GB | Slower | Highest | Research |

### Optimization Tips

1. **Use FP8 for Speed**: 2-3x faster inference than BF16
2. **Enable Tensor Parallelism**: For multi-GPU setups
3. **Configure Batch Size**: Based on available VRAM
4. **Use Caching**: Enable Redis for repeated queries
5. **Monitor Resources**: Use built-in performance monitor

### SGLang Configuration

For optimal SGLang performance:

```bash
# Environment variables for SGLang
export SGLANG_TP_SIZE=2          # Tensor parallelism size
export SGLANG_ENABLE_FP8=true    # Enable FP8 optimization
export SGLANG_MAX_BATCH_SIZE=32  # Batch size optimization
```

## 🔍 Monitoring and Troubleshooting

### Check Service Status
```bash
./deploy.sh status
```

### View Logs
```bash
# Development server logs
./deploy.sh logs deepseek-dev

# Production server logs
./deploy.sh logs deepseek-prod

# SGLang server logs
./deploy.sh logs deepseek-sglang
```

### Performance Monitoring
- **Web Interface**: Access the AI Performance Monitor in E.Vol UI
- **Grafana**: http://localhost:3001 (admin/password from .env)
- **Prometheus**: http://localhost:9090
- **Health Check**: http://localhost:8000/health

### Common Issues

**GPU Not Detected**
```bash
# Check NVIDIA Docker runtime
docker run --rm --gpus all nvidia/cuda:12.1-base-ubuntu22.04 nvidia-smi

# Install NVIDIA Container Toolkit if needed
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

**Out of Memory Errors**
- Reduce batch size in model configuration
- Use FP8 instead of BF16
- Enable model quantization
- Check system resources with `./deploy.sh status`

**Slow Inference**
- Verify GPU utilization in monitoring
- Check for CPU bottlenecks
- Enable tensor parallelism for multi-GPU
- Consider SGLang deployment mode

## 🔒 Security Considerations

### API Keys
- Store API keys securely in `.env` files
- Never commit API keys to version control
- Use environment-specific configurations

### Network Security
- Run behind reverse proxy for production
- Enable HTTPS with proper certificates
- Restrict access to internal networks only

### Resource Limits
- Set container memory limits
- Configure GPU memory allocation
- Monitor resource usage actively

## 📈 Scaling and Production

### Load Balancing
```bash
# Multiple SGLang instances with load balancer
docker-compose --profile sglang scale deepseek-sglang=3
```

### Kubernetes Deployment
For Kubernetes environments:
- Use NVIDIA GPU Operator
- Configure node affinity for GPU nodes
- Implement horizontal pod autoscaling
- Use persistent volumes for model weights

### Cloud Deployment
Recommended cloud configurations:
- **AWS**: EC2 P4d instances with EBS storage
- **Google Cloud**: A2 instances with persistent disks  
- **Azure**: NCv3/NDv2 instances with managed disks

## 🆘 Support and Resources

### Documentation
- [DeepSeek-V3 Official Repo](https://github.com/deepseek-ai/DeepSeek-V3)
- [SGLang Documentation](https://github.com/sgl-project/sglang)
- [vLLM Documentation](https://docs.vllm.ai/)

### Community
- DeepSeek Discord: https://discord.gg/Tc7c45Zzu5
- GitHub Issues: Report problems and get help

### Performance Benchmarks
Expected performance on various hardware:
- **Single A100 (80GB)**: 15-25 tokens/sec (FP8)
- **Dual A100 (80GB each)**: 25-40 tokens/sec (FP8 + TP)
- **Single H100 (80GB)**: 25-35 tokens/sec (FP8)
- **Dual H100 (80GB each)**: 40-60 tokens/sec (FP8 + TP)

## 🎮 Integration with E.Vol

Your E.Vol gaming platform will automatically:
1. **Detect local server** availability on startup
2. **Use local inference** when available for faster responses
3. **Fallback to API** when local server unavailable
4. **Cache responses** to improve performance
5. **Monitor performance** in real-time
6. **Display metrics** via the AI Performance Monitor

The AI-powered games (Riddles, Trivia, Emoji Puzzles, Word Games) will seamlessly switch between local and API inference based on availability and performance.

---

## 🏁 Quick Commands Reference

```bash
# System validation
python3 system_checker.py --quiet

# Model management
python3 model_manager.py list
python3 model_manager.py download deepseek-v3-fp8
python3 model_manager.py set-active deepseek-v3-fp8

# Deployment
./deploy.sh setup     # Initial setup
./deploy.sh dev       # Development mode
./deploy.sh prod      # Production mode
./deploy.sh sglang    # High-performance mode
./deploy.sh monitoring # Monitoring stack

# Monitoring
./deploy.sh status    # Service status
./deploy.sh logs      # View logs
./deploy.sh stop      # Stop all services
./deploy.sh cleanup   # Clean up resources
```

Your E.Vol gaming platform is now ready for AI-powered content generation with local DeepSeek-V3 inference! 🚀
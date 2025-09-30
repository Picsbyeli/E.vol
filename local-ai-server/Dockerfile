# DeepSeek-V3 Local AI Server
# Multi-stage build for optimized production deployment with GPU support

# Base CUDA image with PyTorch support
FROM nvidia/cuda:12.1-devel-ubuntu22.04 as base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_VISIBLE_DEVICES=all

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.10-pip \
    python3.10-dev \
    git \
    wget \
    curl \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python
RUN ln -s /usr/bin/python3.10 /usr/bin/python

# Upgrade pip
RUN python -m pip install --upgrade pip

# Install PyTorch with CUDA support
RUN pip install torch==2.4.1 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Development stage
FROM base as development

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install development tools
RUN pip install ipython jupyter notebook

# Copy application code
COPY . .

# Expose ports
EXPOSE 8000 8888

# Development command
CMD ["python", "server.py"]

# Production stage
FROM base as production

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

# Copy application code
COPY server.py model_manager.py system_checker.py ./

# Create directories for models and logs
RUN mkdir -p models logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Production command
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# Inference-optimized stage with SGLang
FROM base as sglang

WORKDIR /app

# Install SGLang for optimized inference
RUN pip install --upgrade pip && \
    pip install "sglang[all]" && \
    pip install flashinfer -i https://flashinfer.ai/whl/cu121/torch2.4/

# Copy application code
COPY . .

# SGLang optimized startup
CMD ["python", "-m", "sglang.launch_server", \
     "--model-path", "/app/models/deepseek-v3-fp8", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--tp", "2"]
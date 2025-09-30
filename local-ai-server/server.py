#!/usr/bin/env python3
"""
Local DeepSeek-V3 Inference Server for E.Vol Gaming Platform
Supports both local model inference and API fallback with performance monitoring.
"""

import os
import sys
import json
import time
import logging
import asyncio
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from pathlib import Path

import torch
import psutil
import GPUtil
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import requests
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SystemSpecs:
    """System hardware specifications"""
    total_ram_gb: float
    available_ram_gb: float
    gpu_count: int
    gpu_specs: List[Dict[str, Any]]
    total_vram_gb: float
    available_vram_gb: float
    cpu_cores: int
    has_cuda: bool

class InferenceRequest(BaseModel):
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7
    game_type: str = "general"
    use_local: bool = True

class InferenceResponse(BaseModel):
    text: str
    model_used: str
    inference_time_ms: float
    tokens_per_second: float
    gpu_memory_used_gb: Optional[float] = None

class PerformanceMetrics(BaseModel):
    total_requests: int
    avg_response_time_ms: float
    local_requests: int
    api_requests: int
    gpu_utilization_percent: float
    memory_usage_gb: float

class LocalAIServer:
    def __init__(self):
        self.local_model = None
        self.local_model_available = False
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        self.performance_metrics = {
            "total_requests": 0,
            "total_response_time": 0,
            "local_requests": 0,
            "api_requests": 0
        }
        self.system_specs = self._check_system_specs()
        
    def _check_system_specs(self) -> SystemSpecs:
        """Check system hardware specifications"""
        # Memory info
        memory = psutil.virtual_memory()
        total_ram_gb = memory.total / (1024**3)
        available_ram_gb = memory.available / (1024**3)
        
        # GPU info
        gpu_specs = []
        total_vram_gb = 0
        available_vram_gb = 0
        
        try:
            gpus = GPUtil.getGPUs()
            for gpu in gpus:
                gpu_info = {
                    "id": gpu.id,
                    "name": gpu.name,
                    "memory_total_gb": gpu.memoryTotal / 1024,
                    "memory_free_gb": gpu.memoryFree / 1024,
                    "memory_used_gb": gpu.memoryUsed / 1024,
                    "load": gpu.load,
                    "temperature": gpu.temperature
                }
                gpu_specs.append(gpu_info)
                total_vram_gb += gpu.memoryTotal / 1024
                available_vram_gb += gpu.memoryFree / 1024
        except Exception as e:
            logger.warning(f"Could not get GPU info: {e}")
        
        return SystemSpecs(
            total_ram_gb=total_ram_gb,
            available_ram_gb=available_ram_gb,
            gpu_count=len(gpu_specs),
            gpu_specs=gpu_specs,
            total_vram_gb=total_vram_gb,
            available_vram_gb=available_vram_gb,
            cpu_cores=psutil.cpu_count(),
            has_cuda=torch.cuda.is_available()
        )
    
    def can_run_local_model(self) -> bool:
        """Check if system can run DeepSeek-V3 locally"""
        min_vram_gb = 80  # Minimum VRAM for FP8 inference
        min_ram_gb = 32   # Minimum system RAM
        
        specs = self.system_specs
        
        if not specs.has_cuda:
            logger.warning("CUDA not available - cannot run local model")
            return False
            
        if specs.available_vram_gb < min_vram_gb:
            logger.warning(f"Insufficient VRAM: {specs.available_vram_gb}GB < {min_vram_gb}GB required")
            return False
            
        if specs.available_ram_gb < min_ram_gb:
            logger.warning(f"Insufficient RAM: {specs.available_ram_gb}GB < {min_ram_gb}GB required")
            return False
            
        logger.info(f"System capable of local inference: {specs.gpu_count} GPUs, {specs.total_vram_gb}GB VRAM")
        return True
    
    async def load_local_model(self, model_path: str):
        """Load local DeepSeek-V3 model"""
        try:
            if not self.can_run_local_model():
                raise RuntimeError("System does not meet requirements for local model")
            
            logger.info(f"Loading local model from {model_path}")
            
            # This would be replaced with actual model loading
            # For now, we'll simulate model loading
            await asyncio.sleep(5)  # Simulate loading time
            
            # In real implementation:
            # from transformers import AutoTokenizer, AutoModelForCausalLM
            # self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            # self.local_model = AutoModelForCausalLM.from_pretrained(
            #     model_path,
            #     torch_dtype=torch.float8_e4m3fn,  # FP8 for efficiency
            #     device_map="auto"
            # )
            
            self.local_model_available = True
            logger.info("Local model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            self.local_model_available = False
    
    async def local_inference(self, prompt: str, max_tokens: int, temperature: float) -> Dict[str, Any]:
        """Run inference on local model"""
        if not self.local_model_available:
            raise RuntimeError("Local model not available")
        
        start_time = time.time()
        
        try:
            # Get GPU memory before inference
            gpu_memory_before = 0
            if torch.cuda.is_available():
                gpu_memory_before = torch.cuda.memory_allocated() / (1024**3)
            
            # Simulate local inference (replace with actual model inference)
            await asyncio.sleep(0.5)  # Simulate inference time
            
            # In real implementation:
            # inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            # with torch.no_grad():
            #     outputs = self.local_model.generate(
            #         inputs,
            #         max_length=len(inputs[0]) + max_tokens,
            #         temperature=temperature,
            #         do_sample=True,
            #         pad_token_id=self.tokenizer.eos_token_id
            #     )
            # response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Simulated response for demo
            response_text = f"Local AI Response: Generated content for gaming prompt '{prompt[:50]}...'"
            
            # Get GPU memory after inference
            gpu_memory_after = 0
            if torch.cuda.is_available():
                gpu_memory_after = torch.cuda.memory_allocated() / (1024**3)
            
            inference_time = (time.time() - start_time) * 1000
            tokens_per_second = max_tokens / (inference_time / 1000) if inference_time > 0 else 0
            
            return {
                "text": response_text,
                "model_used": "DeepSeek-V3-Local",
                "inference_time_ms": inference_time,
                "tokens_per_second": tokens_per_second,
                "gpu_memory_used_gb": gpu_memory_after - gpu_memory_before
            }
            
        except Exception as e:
            logger.error(f"Local inference failed: {e}")
            raise
    
    async def api_inference(self, prompt: str, max_tokens: int, temperature: float) -> Dict[str, Any]:
        """Fallback to DeepSeek API"""
        if not self.deepseek_api_key:
            raise RuntimeError("DeepSeek API key not available")
        
        start_time = time.time()
        
        try:
            headers = {
                "Authorization": f"Bearer {self.deepseek_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"API request failed: {response.status_code}")
            
            result = response.json()
            response_text = result["choices"][0]["message"]["content"]
            
            inference_time = (time.time() - start_time) * 1000
            tokens_per_second = max_tokens / (inference_time / 1000) if inference_time > 0 else 0
            
            return {
                "text": response_text,
                "model_used": "DeepSeek-V3-API",
                "inference_time_ms": inference_time,
                "tokens_per_second": tokens_per_second,
                "gpu_memory_used_gb": None
            }
            
        except Exception as e:
            logger.error(f"API inference failed: {e}")
            raise
    
    async def generate_response(self, request: InferenceRequest) -> InferenceResponse:
        """Generate AI response with local/API fallback"""
        self.performance_metrics["total_requests"] += 1
        
        try:
            # Try local inference first if requested and available
            if request.use_local and self.local_model_available:
                try:
                    result = await self.local_inference(
                        request.prompt, 
                        request.max_tokens, 
                        request.temperature
                    )
                    self.performance_metrics["local_requests"] += 1
                    logger.info("Used local inference")
                    
                except Exception as e:
                    logger.warning(f"Local inference failed, falling back to API: {e}")
                    result = await self.api_inference(
                        request.prompt,
                        request.max_tokens, 
                        request.temperature
                    )
                    self.performance_metrics["api_requests"] += 1
            else:
                # Use API directly
                result = await self.api_inference(
                    request.prompt,
                    request.max_tokens,
                    request.temperature
                )
                self.performance_metrics["api_requests"] += 1
                logger.info("Used API inference")
            
            # Update performance metrics
            self.performance_metrics["total_response_time"] += result["inference_time_ms"]
            
            return InferenceResponse(**result)
            
        except Exception as e:
            logger.error(f"All inference methods failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_performance_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics"""
        total_requests = self.performance_metrics["total_requests"]
        avg_response_time = (
            self.performance_metrics["total_response_time"] / total_requests
            if total_requests > 0 else 0
        )
        
        # Get current GPU utilization
        gpu_utilization = 0
        if torch.cuda.is_available():
            try:
                gpus = GPUtil.getGPUs()
                gpu_utilization = sum(gpu.load for gpu in gpus) / len(gpus) * 100 if gpus else 0
            except:
                gpu_utilization = 0
        
        # Get current memory usage
        memory = psutil.virtual_memory()
        memory_usage_gb = (memory.total - memory.available) / (1024**3)
        
        return PerformanceMetrics(
            total_requests=total_requests,
            avg_response_time_ms=avg_response_time,
            local_requests=self.performance_metrics["local_requests"],
            api_requests=self.performance_metrics["api_requests"],
            gpu_utilization_percent=gpu_utilization,
            memory_usage_gb=memory_usage_gb
        )

# Global server instance
ai_server = LocalAIServer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Local AI Server for E.Vol Gaming Platform")
    logger.info(f"System specs: {ai_server.system_specs}")
    
    # Try to load local model if weights are available
    model_path = os.getenv("DEEPSEEK_MODEL_PATH", "/path/to/DeepSeek-V3")
    if Path(model_path).exists():
        try:
            await ai_server.load_local_model(model_path)
        except Exception as e:
            logger.warning(f"Could not load local model: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Local AI Server")

# FastAPI app
app = FastAPI(
    title="E.Vol Local AI Server",
    description="Local DeepSeek-V3 inference server with API fallback",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # E.Vol frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "local_model_available": ai_server.local_model_available,
        "api_available": ai_server.deepseek_api_key is not None,
        "system_specs": ai_server.system_specs
    }

@app.post("/generate", response_model=InferenceResponse)
async def generate_content(request: InferenceRequest):
    """Generate AI content for gaming"""
    return await ai_server.generate_response(request)

@app.get("/metrics", response_model=PerformanceMetrics)
async def get_metrics():
    """Get performance metrics"""
    return ai_server.get_performance_metrics()

@app.get("/system-specs")
async def get_system_specs():
    """Get system specifications"""
    return ai_server.system_specs

@app.post("/load-model")
async def load_model(model_path: str):
    """Load local model"""
    try:
        await ai_server.load_local_model(model_path)
        return {"status": "success", "message": "Model loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVER_PORT", 8000))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
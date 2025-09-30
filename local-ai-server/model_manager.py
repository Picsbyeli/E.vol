#!/usr/bin/env python3
"""
DeepSeek-V3 Model Weight Management Script
Handles downloading, converting, and managing model weights with FP8/BF16 support.
"""

import os
import sys
import json
import shutil
import hashlib
import logging
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

import requests
from tqdm import tqdm
import torch
from huggingface_hub import snapshot_download, login

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ModelConfig:
    """Model configuration"""
    name: str
    repo_id: str
    size_gb: float
    min_vram_gb: float
    min_ram_gb: float
    precision: str
    description: str

# Available model configurations
AVAILABLE_MODELS = {
    "deepseek-v3-fp8": ModelConfig(
        name="DeepSeek-V3-FP8",
        repo_id="deepseek-ai/DeepSeek-V3",
        size_gb=350,
        min_vram_gb=80,
        min_ram_gb=32,
        precision="fp8",
        description="DeepSeek-V3 with FP8 quantization (recommended for inference)"
    ),
    "deepseek-v3-base": ModelConfig(
        name="DeepSeek-V3-Base",
        repo_id="deepseek-ai/DeepSeek-V3-Base",
        size_gb=1300,
        min_vram_gb=160,
        min_ram_gb=64,
        precision="bf16",
        description="DeepSeek-V3 Base model with full precision"
    )
}

class ModelManager:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        self.config_file = self.models_dir / "models_config.json"
        self.load_config()
    
    def load_config(self):
        """Load model configuration"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {"installed_models": {}, "active_model": None}
    
    def save_config(self):
        """Save model configuration"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def check_disk_space(self, required_gb: float) -> bool:
        """Check if enough disk space is available"""
        free_space = shutil.disk_usage(self.models_dir).free / (1024**3)
        return free_space >= required_gb * 1.2  # 20% buffer
    
    def check_system_requirements(self, model_config: ModelConfig) -> Dict[str, bool]:
        """Check if system meets model requirements"""
        import psutil
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            total_vram = sum(gpu.memoryTotal for gpu in gpus) / 1024  # Convert to GB
            has_cuda = torch.cuda.is_available()
        except:
            total_vram = 0
            has_cuda = False
        
        memory = psutil.virtual_memory()
        total_ram = memory.total / (1024**3)
        
        return {
            "disk_space": self.check_disk_space(model_config.size_gb),
            "ram": total_ram >= model_config.min_ram_gb,
            "vram": total_vram >= model_config.min_vram_gb,
            "cuda": has_cuda,
            "details": {
                "total_ram_gb": total_ram,
                "required_ram_gb": model_config.min_ram_gb,
                "total_vram_gb": total_vram,
                "required_vram_gb": model_config.min_vram_gb,
                "disk_free_gb": shutil.disk_usage(self.models_dir).free / (1024**3),
                "required_disk_gb": model_config.size_gb
            }
        }
    
    def download_model(self, model_key: str, hf_token: Optional[str] = None) -> bool:
        """Download model weights from Hugging Face"""
        if model_key not in AVAILABLE_MODELS:
            logger.error(f"Unknown model: {model_key}")
            return False
        
        model_config = AVAILABLE_MODELS[model_key]
        model_path = self.models_dir / model_key
        
        # Check system requirements
        requirements = self.check_system_requirements(model_config)
        if not all([requirements["disk_space"], requirements["ram"]]):
            logger.error("System requirements not met:")
            for req, met in requirements.items():
                if req != "details" and not met:
                    logger.error(f"  {req}: ❌")
            return False
        
        logger.info(f"Downloading {model_config.name}...")
        logger.info(f"Size: {model_config.size_gb}GB")
        logger.info(f"Requirements: {model_config.min_ram_gb}GB RAM, {model_config.min_vram_gb}GB VRAM")
        
        try:
            # Login to Hugging Face if token provided
            if hf_token:
                login(token=hf_token)
            
            # Download model
            snapshot_download(
                repo_id=model_config.repo_id,
                local_dir=str(model_path),
                local_dir_use_symlinks=False,
                resume_download=True
            )
            
            # Update config
            self.config["installed_models"][model_key] = {
                "name": model_config.name,
                "path": str(model_path),
                "size_gb": model_config.size_gb,
                "precision": model_config.precision,
                "installed_at": str(pd.Timestamp.now())
            }
            self.save_config()
            
            logger.info(f"Successfully downloaded {model_config.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download model: {e}")
            if model_path.exists():
                shutil.rmtree(model_path)
            return False
    
    def convert_fp8_to_bf16(self, model_key: str) -> bool:
        """Convert FP8 model to BF16"""
        if model_key not in self.config["installed_models"]:
            logger.error(f"Model {model_key} not installed")
            return False
        
        model_info = self.config["installed_models"][model_key]
        if model_info["precision"] != "fp8":
            logger.error(f"Model {model_key} is not FP8")
            return False
        
        input_path = Path(model_info["path"])
        output_path = self.models_dir / f"{model_key}-bf16"
        
        logger.info(f"Converting {model_key} from FP8 to BF16...")
        
        try:
            # Use the conversion script from DeepSeek-V3
            conversion_script = Path("DeepSeek-V3/inference/fp8_cast_bf16.py")
            if not conversion_script.exists():
                logger.error("Conversion script not found. Ensure DeepSeek-V3 repo is cloned.")
                return False
            
            cmd = [
                sys.executable,
                str(conversion_script),
                "--input-fp8-hf-path", str(input_path),
                "--output-bf16-hf-path", str(output_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Conversion failed: {result.stderr}")
                return False
            
            # Update config
            bf16_key = f"{model_key}-bf16"
            self.config["installed_models"][bf16_key] = {
                "name": f"{model_info['name']}-BF16",
                "path": str(output_path),
                "size_gb": model_info["size_gb"] * 1.8,  # BF16 is larger
                "precision": "bf16",
                "converted_from": model_key,
                "installed_at": str(pd.Timestamp.now())
            }
            self.save_config()
            
            logger.info(f"Successfully converted to BF16: {bf16_key}")
            return True
            
        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            return False
    
    def prepare_model_for_inference(self, model_key: str) -> bool:
        """Prepare model weights for inference"""
        if model_key not in self.config["installed_models"]:
            logger.error(f"Model {model_key} not installed")
            return False
        
        model_info = self.config["installed_models"][model_key]
        model_path = Path(model_info["path"])
        demo_path = model_path.parent / f"{model_key}-demo"
        
        logger.info(f"Preparing {model_key} for inference...")
        
        try:
            # Use the conversion script from DeepSeek-V3
            conversion_script = Path("DeepSeek-V3/inference/convert.py")
            if not conversion_script.exists():
                logger.error("Conversion script not found. Ensure DeepSeek-V3 repo is cloned.")
                return False
            
            cmd = [
                sys.executable,
                str(conversion_script),
                "--hf-ckpt-path", str(model_path),
                "--save-path", str(demo_path),
                "--n-experts", "256",
                "--model-parallel", "16"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Preparation failed: {result.stderr}")
                return False
            
            # Update config
            self.config["installed_models"][model_key]["demo_path"] = str(demo_path)
            self.config["installed_models"][model_key]["ready_for_inference"] = True
            self.save_config()
            
            logger.info(f"Model prepared for inference: {demo_path}")
            return True
            
        except Exception as e:
            logger.error(f"Preparation failed: {e}")
            return False
    
    def set_active_model(self, model_key: str) -> bool:
        """Set active model for inference"""
        if model_key not in self.config["installed_models"]:
            logger.error(f"Model {model_key} not installed")
            return False
        
        self.config["active_model"] = model_key
        self.save_config()
        logger.info(f"Active model set to: {model_key}")
        return True
    
    def list_models(self):
        """List available and installed models"""
        print("\n=== Available Models ===")
        for key, config in AVAILABLE_MODELS.items():
            status = "✅ INSTALLED" if key in self.config["installed_models"] else "❌ NOT INSTALLED"
            active = "🎯 ACTIVE" if self.config.get("active_model") == key else ""
            print(f"{key}: {config.name} ({config.size_gb}GB) {status} {active}")
            print(f"  {config.description}")
            print(f"  Requirements: {config.min_ram_gb}GB RAM, {config.min_vram_gb}GB VRAM")
            print()
    
    def remove_model(self, model_key: str) -> bool:
        """Remove installed model"""
        if model_key not in self.config["installed_models"]:
            logger.error(f"Model {model_key} not installed")
            return False
        
        model_info = self.config["installed_models"][model_key]
        model_path = Path(model_info["path"])
        
        try:
            if model_path.exists():
                shutil.rmtree(model_path)
            
            # Remove demo path if exists
            if "demo_path" in model_info:
                demo_path = Path(model_info["demo_path"])
                if demo_path.exists():
                    shutil.rmtree(demo_path)
            
            # Update config
            del self.config["installed_models"][model_key]
            if self.config.get("active_model") == model_key:
                self.config["active_model"] = None
            self.save_config()
            
            logger.info(f"Successfully removed {model_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove model: {e}")
            return False

def main():
    """Main CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="DeepSeek-V3 Model Manager")
    parser.add_argument("--models-dir", default="models", help="Models directory")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List models")
    
    # Download command
    download_parser = subparsers.add_parser("download", help="Download model")
    download_parser.add_argument("model", choices=AVAILABLE_MODELS.keys(), help="Model to download")
    download_parser.add_argument("--hf-token", help="Hugging Face token")
    
    # Convert command
    convert_parser = subparsers.add_parser("convert", help="Convert FP8 to BF16")
    convert_parser.add_argument("model", help="Model to convert")
    
    # Prepare command
    prepare_parser = subparsers.add_parser("prepare", help="Prepare model for inference")
    prepare_parser.add_argument("model", help="Model to prepare")
    
    # Set active command
    active_parser = subparsers.add_parser("set-active", help="Set active model")
    active_parser.add_argument("model", help="Model to set as active")
    
    # Remove command
    remove_parser = subparsers.add_parser("remove", help="Remove model")
    remove_parser.add_argument("model", help="Model to remove")
    
    # Check requirements command
    check_parser = subparsers.add_parser("check", help="Check system requirements")
    check_parser.add_argument("model", choices=AVAILABLE_MODELS.keys(), help="Model to check")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = ModelManager(args.models_dir)
    
    if args.command == "list":
        manager.list_models()
    
    elif args.command == "download":
        success = manager.download_model(args.model, args.hf_token)
        sys.exit(0 if success else 1)
    
    elif args.command == "convert":
        success = manager.convert_fp8_to_bf16(args.model)
        sys.exit(0 if success else 1)
    
    elif args.command == "prepare":
        success = manager.prepare_model_for_inference(args.model)
        sys.exit(0 if success else 1)
    
    elif args.command == "set-active":
        success = manager.set_active_model(args.model)
        sys.exit(0 if success else 1)
    
    elif args.command == "remove":
        success = manager.remove_model(args.model)
        sys.exit(0 if success else 1)
    
    elif args.command == "check":
        model_config = AVAILABLE_MODELS[args.model]
        requirements = manager.check_system_requirements(model_config)
        
        print(f"\n=== System Requirements for {model_config.name} ===")
        print(f"Disk Space: {'✅' if requirements['disk_space'] else '❌'}")
        print(f"RAM: {'✅' if requirements['ram'] else '❌'}")
        print(f"VRAM: {'✅' if requirements['vram'] else '❌'}")
        print(f"CUDA: {'✅' if requirements['cuda'] else '❌'}")
        print(f"\nDetails:")
        for key, value in requirements["details"].items():
            print(f"  {key}: {value}")

if __name__ == "__main__":
    main()
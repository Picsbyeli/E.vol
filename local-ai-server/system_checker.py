#!/usr/bin/env python3
"""
System Requirements Checker for DeepSeek-V3 Local Deployment
Validates hardware capabilities and provides optimization recommendations.
"""

import os
import sys
import json
import platform
import subprocess
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

import psutil
import torch

@dataclass
class GPUInfo:
    """GPU information"""
    id: int
    name: str
    memory_total_gb: float
    memory_free_gb: float
    memory_used_gb: float
    utilization_percent: float
    temperature_c: Optional[float]
    power_usage_w: Optional[float]
    driver_version: Optional[str]
    cuda_capability: Optional[str]

@dataclass
class SystemInfo:
    """Complete system information"""
    cpu_model: str
    cpu_cores: int
    cpu_threads: int
    ram_total_gb: float
    ram_available_gb: float
    storage_free_gb: float
    os_name: str
    os_version: str
    python_version: str
    torch_version: str
    cuda_available: bool
    cuda_version: Optional[str]
    gpus: List[GPUInfo]

@dataclass
class RequirementCheck:
    """Requirement check result"""
    name: str
    required: Any
    actual: Any
    passed: bool
    recommendation: str
    critical: bool = True

class SystemChecker:
    def __init__(self):
        self.system_info = self._gather_system_info()
    
    def _gather_system_info(self) -> SystemInfo:
        """Gather comprehensive system information"""
        # CPU information
        cpu_model = platform.processor() or "Unknown"
        cpu_cores = psutil.cpu_count(logical=False)
        cpu_threads = psutil.cpu_count(logical=True)
        
        # Memory information
        memory = psutil.virtual_memory()
        ram_total_gb = memory.total / (1024**3)
        ram_available_gb = memory.available / (1024**3)
        
        # Storage information
        storage = psutil.disk_usage('/')
        storage_free_gb = storage.free / (1024**3)
        
        # OS information
        os_name = platform.system()
        os_version = platform.version()
        
        # Python and PyTorch versions
        python_version = platform.python_version()
        torch_version = torch.__version__
        
        # CUDA information
        cuda_available = torch.cuda.is_available()
        cuda_version = torch.version.cuda if cuda_available else None
        
        # GPU information
        gpus = self._get_gpu_info()
        
        return SystemInfo(
            cpu_model=cpu_model,
            cpu_cores=cpu_cores,
            cpu_threads=cpu_threads,
            ram_total_gb=ram_total_gb,
            ram_available_gb=ram_available_gb,
            storage_free_gb=storage_free_gb,
            os_name=os_name,
            os_version=os_version,
            python_version=python_version,
            torch_version=torch_version,
            cuda_available=cuda_available,
            cuda_version=cuda_version,
            gpus=gpus
        )
    
    def _get_gpu_info(self) -> List[GPUInfo]:
        """Get detailed GPU information"""
        gpus = []
        
        if not torch.cuda.is_available():
            return gpus
        
        try:
            import GPUtil
            gpu_list = GPUtil.getGPUs()
            
            for i, gpu in enumerate(gpu_list):
                # Get CUDA capability
                cuda_capability = None
                if torch.cuda.is_available():
                    try:
                        capability = torch.cuda.get_device_capability(i)
                        cuda_capability = f"{capability[0]}.{capability[1]}"
                    except:
                        pass
                
                gpu_info = GPUInfo(
                    id=gpu.id,
                    name=gpu.name,
                    memory_total_gb=gpu.memoryTotal / 1024,
                    memory_free_gb=gpu.memoryFree / 1024,
                    memory_used_gb=gpu.memoryUsed / 1024,
                    utilization_percent=gpu.load * 100,
                    temperature_c=gpu.temperature,
                    power_usage_w=None,  # GPUtil doesn't provide this
                    driver_version=gpu.driver,
                    cuda_capability=cuda_capability
                )
                gpus.append(gpu_info)
                
        except ImportError:
            # Fallback to basic torch info
            if torch.cuda.is_available():
                for i in range(torch.cuda.device_count()):
                    props = torch.cuda.get_device_properties(i)
                    memory_total = props.total_memory / (1024**3)
                    
                    gpu_info = GPUInfo(
                        id=i,
                        name=props.name,
                        memory_total_gb=memory_total,
                        memory_free_gb=memory_total,  # Approximation
                        memory_used_gb=0,
                        utilization_percent=0,
                        temperature_c=None,
                        power_usage_w=None,
                        driver_version=None,
                        cuda_capability=f"{props.major}.{props.minor}"
                    )
                    gpus.append(gpu_info)
        
        return gpus
    
    def check_deepseek_v3_requirements(self, precision: str = "fp8") -> List[RequirementCheck]:
        """Check DeepSeek-V3 specific requirements"""
        checks = []
        
        # Define requirements based on precision
        if precision == "fp8":
            min_vram_per_gpu = 40  # GB for FP8
            min_total_vram = 80    # GB total
            min_ram = 32           # GB
            min_storage = 400      # GB
        else:  # bf16
            min_vram_per_gpu = 80  # GB for BF16
            min_total_vram = 160   # GB total
            min_ram = 64           # GB
            min_storage = 1400     # GB
        
        # Operating system check
        checks.append(RequirementCheck(
            name="Operating System",
            required="Linux",
            actual=self.system_info.os_name,
            passed=self.system_info.os_name == "Linux",
            recommendation="DeepSeek-V3 inference is only officially supported on Linux",
            critical=True
        ))
        
        # Python version check
        python_major, python_minor = map(int, self.system_info.python_version.split('.')[:2])
        python_version_ok = python_major == 3 and python_minor >= 8
        checks.append(RequirementCheck(
            name="Python Version",
            required="3.8+",
            actual=self.system_info.python_version,
            passed=python_version_ok,
            recommendation="Install Python 3.8 or later" if not python_version_ok else "✓ Compatible",
            critical=True
        ))
        
        # CUDA availability check
        checks.append(RequirementCheck(
            name="CUDA Support",
            required="Available",
            actual="Available" if self.system_info.cuda_available else "Not Available",
            passed=self.system_info.cuda_available,
            recommendation="Install NVIDIA drivers and CUDA toolkit" if not self.system_info.cuda_available else "✓ CUDA ready",
            critical=True
        ))
        
        # GPU count check
        gpu_count = len(self.system_info.gpus)
        min_gpus = 2 if precision == "bf16" else 1
        checks.append(RequirementCheck(
            name="GPU Count",
            required=f"{min_gpus}+",
            actual=gpu_count,
            passed=gpu_count >= min_gpus,
            recommendation=f"Need at least {min_gpus} GPUs for {precision} inference" if gpu_count < min_gpus else "✓ Sufficient GPUs",
            critical=True
        ))
        
        # Individual GPU VRAM check
        if self.system_info.gpus:
            max_gpu_vram = max(gpu.memory_total_gb for gpu in self.system_info.gpus)
            checks.append(RequirementCheck(
                name="GPU VRAM (per GPU)",
                required=f"{min_vram_per_gpu}GB",
                actual=f"{max_gpu_vram:.1f}GB",
                passed=max_gpu_vram >= min_vram_per_gpu,
                recommendation=f"Need GPUs with at least {min_vram_per_gpu}GB VRAM each" if max_gpu_vram < min_vram_per_gpu else "✓ Sufficient VRAM per GPU",
                critical=True
            ))
        
        # Total VRAM check
        total_vram = sum(gpu.memory_total_gb for gpu in self.system_info.gpus)
        checks.append(RequirementCheck(
            name="Total VRAM",
            required=f"{min_total_vram}GB",
            actual=f"{total_vram:.1f}GB",
            passed=total_vram >= min_total_vram,
            recommendation=f"Need at least {min_total_vram}GB total VRAM" if total_vram < min_total_vram else "✓ Sufficient total VRAM",
            critical=True
        ))
        
        # System RAM check
        checks.append(RequirementCheck(
            name="System RAM",
            required=f"{min_ram}GB",
            actual=f"{self.system_info.ram_total_gb:.1f}GB",
            passed=self.system_info.ram_total_gb >= min_ram,
            recommendation=f"Need at least {min_ram}GB system RAM" if self.system_info.ram_total_gb < min_ram else "✓ Sufficient RAM",
            critical=True
        ))
        
        # Storage space check
        checks.append(RequirementCheck(
            name="Free Storage",
            required=f"{min_storage}GB",
            actual=f"{self.system_info.storage_free_gb:.1f}GB",
            passed=self.system_info.storage_free_gb >= min_storage,
            recommendation=f"Need at least {min_storage}GB free storage" if self.system_info.storage_free_gb < min_storage else "✓ Sufficient storage",
            critical=True
        ))
        
        # CUDA capability check
        if self.system_info.gpus:
            min_capability = 7.0  # Minimum for FP8
            gpu_capabilities = []
            all_compatible = True
            
            for gpu in self.system_info.gpus:
                if gpu.cuda_capability:
                    capability = float(gpu.cuda_capability)
                    gpu_capabilities.append(capability)
                    if capability < min_capability:
                        all_compatible = False
            
            if gpu_capabilities:
                min_found = min(gpu_capabilities)
                checks.append(RequirementCheck(
                    name="CUDA Compute Capability",
                    required=f"{min_capability}+",
                    actual=f"{min_found}",
                    passed=all_compatible,
                    recommendation="Need GPUs with compute capability 7.0+ for optimal performance" if not all_compatible else "✓ Compatible GPUs",
                    critical=False
                ))
        
        return checks
    
    def get_optimization_recommendations(self) -> List[str]:
        """Get optimization recommendations based on system"""
        recommendations = []
        
        # GPU-specific recommendations
        if self.system_info.gpus:
            total_vram = sum(gpu.memory_total_gb for gpu in self.system_info.gpus)
            
            if total_vram >= 160:
                recommendations.append("💡 Your system can run DeepSeek-V3 in BF16 mode for maximum quality")
            elif total_vram >= 80:
                recommendations.append("💡 Use FP8 mode for optimal performance on your hardware")
            
            # Multi-GPU recommendations
            if len(self.system_info.gpus) > 1:
                recommendations.append(f"💡 {len(self.system_info.gpus)} GPUs detected - enable tensor parallelism")
                recommendations.append("💡 Consider using SGLang or vLLM for multi-GPU deployment")
        
        # Memory recommendations
        if self.system_info.ram_total_gb >= 128:
            recommendations.append("💡 High RAM allows for larger batch sizes and caching")
        elif self.system_info.ram_total_gb < 32:
            recommendations.append("⚠️ Consider upgrading RAM for better performance")
        
        # Storage recommendations
        if self.system_info.storage_free_gb < 500:
            recommendations.append("⚠️ Limited storage - consider external storage for model weights")
        
        # CPU recommendations
        if self.system_info.cpu_threads >= 32:
            recommendations.append("💡 High core count CPU - optimal for preprocessing and batching")
        
        return recommendations
    
    def print_system_report(self):
        """Print comprehensive system report"""
        print("=" * 80)
        print("🖥️  DEEPSEEK-V3 SYSTEM COMPATIBILITY REPORT")
        print("=" * 80)
        
        # System overview
        print(f"\n📋 SYSTEM OVERVIEW")
        print(f"OS: {self.system_info.os_name} {self.system_info.os_version}")
        print(f"CPU: {self.system_info.cpu_model} ({self.system_info.cpu_cores} cores, {self.system_info.cpu_threads} threads)")
        print(f"RAM: {self.system_info.ram_total_gb:.1f}GB total, {self.system_info.ram_available_gb:.1f}GB available")
        print(f"Storage: {self.system_info.storage_free_gb:.1f}GB free")
        print(f"Python: {self.system_info.python_version}")
        print(f"PyTorch: {self.system_info.torch_version}")
        print(f"CUDA: {self.system_info.cuda_version if self.system_info.cuda_available else 'Not Available'}")
        
        # GPU details
        print(f"\n🎮 GPU INFORMATION")
        if self.system_info.gpus:
            for gpu in self.system_info.gpus:
                print(f"GPU {gpu.id}: {gpu.name}")
                print(f"  VRAM: {gpu.memory_total_gb:.1f}GB total, {gpu.memory_free_gb:.1f}GB free")
                print(f"  Utilization: {gpu.utilization_percent:.1f}%")
                if gpu.temperature_c:
                    print(f"  Temperature: {gpu.temperature_c}°C")
                if gpu.cuda_capability:
                    print(f"  CUDA Capability: {gpu.cuda_capability}")
        else:
            print("No GPUs detected")
        
        # FP8 requirements check
        print(f"\n✅ FP8 INFERENCE REQUIREMENTS")
        fp8_checks = self.check_deepseek_v3_requirements("fp8")
        passed_count = sum(1 for check in fp8_checks if check.passed)
        total_count = len(fp8_checks)
        
        for check in fp8_checks:
            status = "✅" if check.passed else "❌"
            print(f"{status} {check.name}: {check.actual} (required: {check.required})")
            if not check.passed:
                print(f"   💡 {check.recommendation}")
        
        print(f"\nFP8 Compatibility: {passed_count}/{total_count} requirements met")
        
        # BF16 requirements check
        print(f"\n🔍 BF16 INFERENCE REQUIREMENTS")
        bf16_checks = self.check_deepseek_v3_requirements("bf16")
        passed_count = sum(1 for check in bf16_checks if check.passed)
        total_count = len(bf16_checks)
        
        for check in bf16_checks:
            status = "✅" if check.passed else "❌"
            print(f"{status} {check.name}: {check.actual} (required: {check.required})")
        
        print(f"\nBF16 Compatibility: {passed_count}/{total_count} requirements met")
        
        # Optimization recommendations
        recommendations = self.get_optimization_recommendations()
        if recommendations:
            print(f"\n💡 OPTIMIZATION RECOMMENDATIONS")
            for rec in recommendations:
                print(f"   {rec}")
        
        # Deployment suggestions
        print(f"\n🚀 DEPLOYMENT SUGGESTIONS")
        if any(check.passed for check in self.check_deepseek_v3_requirements("fp8")):
            print("   • Start with FP8 inference for testing")
            print("   • Use SGLang or vLLM for production deployment")
            print("   • Enable tensor parallelism if multiple GPUs available")
        else:
            print("   • Consider using DeepSeek API as fallback")
            print("   • Upgrade hardware for local inference")
            print("   • Use cloud GPU instances (A100, H100)")
        
        print("=" * 80)
    
    def export_report(self, filename: str = "system_report.json"):
        """Export system report to JSON"""
        report = {
            "system_info": asdict(self.system_info),
            "fp8_requirements": [asdict(check) for check in self.check_deepseek_v3_requirements("fp8")],
            "bf16_requirements": [asdict(check) for check in self.check_deepseek_v3_requirements("bf16")],
            "recommendations": self.get_optimization_recommendations()
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report exported to {filename}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="DeepSeek-V3 System Requirements Checker")
    parser.add_argument("--export", help="Export report to JSON file")
    parser.add_argument("--precision", choices=["fp8", "bf16"], default="fp8", 
                       help="Check requirements for specific precision")
    parser.add_argument("--quiet", "-q", action="store_true", 
                       help="Only show compatibility summary")
    
    args = parser.parse_args()
    
    checker = SystemChecker()
    
    if args.quiet:
        # Just show compatibility summary
        checks = checker.check_deepseek_v3_requirements(args.precision)
        passed = all(check.passed for check in checks if check.critical)
        print(f"DeepSeek-V3 {args.precision.upper()} compatibility: {'✅ COMPATIBLE' if passed else '❌ NOT COMPATIBLE'}")
    else:
        # Show full report
        checker.print_system_report()
    
    if args.export:
        checker.export_report(args.export)

if __name__ == "__main__":
    main()
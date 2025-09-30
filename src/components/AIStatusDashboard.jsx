import React, { useState, useEffect } from 'react';
import { getAIMetrics, getCacheStats } from '../lib/ai';

export default function AIStatusDashboard() {
  const [status, setStatus] = useState({
    localAI: 'checking',
    deepseekAPI: 'checking',
    cache: null,
    metrics: null
  });

  const checkStatus = async () => {
    // Check local AI server
    try {
      const response = await fetch('http://localhost:8000/health', { timeout: 2000 });
      const health = await response.json();
      setStatus(prev => ({
        ...prev,
        localAI: health.status === 'healthy' ? 'online' : 'offline'
      }));
    } catch (error) {
      setStatus(prev => ({ ...prev, localAI: 'offline' }));
    }

    // Check DeepSeek API status (indirectly)
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY') {
      setStatus(prev => ({ ...prev, deepseekAPI: 'not_configured' }));
    } else if (apiKey.startsWith('sk-')) {
      // API key is configured, but we need to check if it has credits
      setStatus(prev => ({ ...prev, deepseekAPI: 'configured' }));
    }

    // Get cache stats
    const cacheStats = getCacheStats();
    setStatus(prev => ({ ...prev, cache: cacheStats }));

    // Get AI metrics if available
    try {
      const metrics = await getAIMetrics();
      setStatus(prev => ({ ...prev, metrics }));
    } catch (error) {
      // Metrics not available
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'configured': return 'text-yellow-600 bg-yellow-100';
      case 'not_configured': return 'text-gray-600 bg-gray-100';
      case 'checking': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'configured': return 'Configured';
      case 'not_configured': return 'Not Configured';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          🤖 AI Status
        </h3>
        <button 
          onClick={checkStatus}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* Local AI Server Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Local Server:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.localAI)}`}>
            {getStatusText(status.localAI)}
          </span>
        </div>

        {/* DeepSeek API Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">DeepSeek API:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.deepseekAPI)}`}>
            {getStatusText(status.deepseekAPI)}
          </span>
        </div>

        {/* Cache Statistics */}
        {status.cache && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Cache:</span>
            <span className="text-xs text-gray-500">
              {status.cache.valid_entries}/{status.cache.total_entries} valid
            </span>
          </div>
        )}

        {/* Performance Metrics */}
        {status.metrics && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Requests:</span>
              <span className="text-xs text-gray-500">
                {status.metrics.total_requests}
              </span>
            </div>
            {status.metrics.avg_response_time_ms && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Time:</span>
                <span className="text-xs text-gray-500">
                  {Math.round(status.metrics.avg_response_time_ms)}ms
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {status.deepseekAPI === 'not_configured' && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
            💡 Add your DeepSeek API key to .env for API fallback
          </div>
        )}

        {status.localAI === 'offline' && status.deepseekAPI === 'configured' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            ℹ️ Using DeepSeek API. Start local server for faster responses.
          </div>
        )}

        {status.localAI === 'offline' && status.deepseekAPI === 'not_configured' && (
          <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
            ⚠️ No AI services available. Configure API key or start local server.
          </div>
        )}

        {status.localAI === 'online' && (
          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
            ✅ Local AI server active. Using local inference for best performance!
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          {status.localAI === 'offline' && (
            <a 
              href="/local-ai-server/README.md"
              target="_blank"
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Setup Local AI
            </a>
          )}
          {status.deepseekAPI === 'configured' && (
            <a 
              href="https://platform.deepseek.com/"
              target="_blank"
              className="text-xs text-purple-600 hover:text-purple-700 underline"
            >
              DeepSeek Console
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
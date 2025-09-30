import { useState, useEffect } from 'react';
import { getAIMetrics, getCacheStats } from '../lib/ai';

const AIPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [aiMetrics, cache] = await Promise.all([
        getAIMetrics(),
        getCacheStats()
      ]);
      setMetrics(aiMetrics);
      setCacheStats(cache);
    } catch (error) {
      console.error('Failed to fetch AI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isExpanded]);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num < 1000) return num.toFixed(1);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
  };

  const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return 'N/A';
    if (bytes < 1024) return bytes.toFixed(1) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getStatusColor = (value, thresholds) => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (value >= thresholds.high) return 'text-red-400';
    if (value >= thresholds.medium) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 mb-2"
      >
        <span className="text-sm font-medium">AI Monitor</span>
        <div className={`w-3 h-3 rounded-full ${metrics ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Metrics Panel */}
      {isExpanded && (
        <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 min-w-80 max-w-96 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-purple-300">AI Performance</h3>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="text-purple-300 hover:text-purple-100 disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Server Status */}
              <div className="bg-gray-700 rounded p-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Server Status</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Local AI:</span>
                    <span className={`ml-1 ${metrics ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">API Fallback:</span>
                    <span className="ml-1 text-green-400">Ready</span>
                  </div>
                </div>
              </div>

              {/* Request Metrics */}
              {metrics && (
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Request Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Total:</span>
                      <span className="ml-1 text-blue-300">{formatNumber(metrics.total_requests)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Time:</span>
                      <span className={`ml-1 ${getStatusColor(metrics.avg_response_time_ms, { medium: 1000, high: 3000 })}`}>
                        {metrics.avg_response_time_ms?.toFixed(0)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Local:</span>
                      <span className="ml-1 text-green-300">{formatNumber(metrics.local_requests)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">API:</span>
                      <span className="ml-1 text-yellow-300">{formatNumber(metrics.api_requests)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* System Resources */}
              {metrics && (
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">System Resources</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">GPU Usage:</span>
                      <span className={`ml-1 ${getStatusColor(metrics.gpu_utilization_percent, { medium: 70, high: 90 })}`}>
                        {metrics.gpu_utilization_percent?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Memory:</span>
                      <span className={`ml-1 ${getStatusColor(metrics.memory_usage_gb, { medium: 16, high: 28 })}`}>
                        {formatBytes(metrics.memory_usage_gb * 1024 * 1024 * 1024)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cache Statistics */}
              {cacheStats && (
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Cache Performance</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Entries:</span>
                      <span className="ml-1 text-blue-300">{cacheStats.total_entries}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Valid:</span>
                      <span className="ml-1 text-green-300">{cacheStats.valid_entries}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Hit Rate:</span>
                      <span className={`ml-1 ${getStatusColor(cacheStats.cache_hit_potential * 100, { medium: 50, high: 80 })}`}>
                        {(cacheStats.cache_hit_potential * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div className="bg-gray-700 rounded p-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Tips</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  {!metrics && (
                    <div>• Start local AI server for faster responses</div>
                  )}
                  {metrics && metrics.gpu_utilization_percent > 90 && (
                    <div className="text-yellow-300">• High GPU usage detected</div>
                  )}
                  {metrics && metrics.avg_response_time_ms > 3000 && (
                    <div className="text-yellow-300">• Consider using FP8 mode for speed</div>
                  )}
                  {cacheStats && cacheStats.cache_hit_potential < 0.3 && (
                    <div className="text-blue-300">• Cache warming up...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPerformanceMonitor;
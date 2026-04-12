import React, { useState, useEffect } from 'react';
import { useContent } from '../../hooks/useContent';
import Card from '../shared/Card';
import LoadingSpinner from '../shared/LoadingSpinner';
import Alert from '../shared/Alert';
import Select from '../shared/Select';

interface ContentAnalyticsProps {
  contentId?: string;
}

const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ contentId }) => {
  const { getContentAnalytics, isLoading, error } = useContent();
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [contentId, timeRange]);

  const fetchAnalytics = async () => {
    if (!contentId) return;
    
    try {
      const result = await getContentAnalytics(contentId);
      setAnalytics(result);
    } catch (err) {
      console.error('Error fetching content analytics:', err);
    }
  };

  if (isLoading && !analytics) {
    return (
      <Card className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert type="error" message={error} />
      </Card>
    );
  }

  if (!contentId) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          Select a content piece to view analytics
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Content Analytics</h2>
        <Select
          options={timeRangeOptions}
          value={timeRange}
          onChange={setTimeRange}
          className="w-48"
        />
      </div>

      {analytics ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Views</div>
              <div className="text-2xl font-bold">{analytics.views}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Unique Visitors</div>
              <div className="text-2xl font-bold">{analytics.uniqueVisitors}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Avg. Time on Page</div>
              <div className="text-2xl font-bold">{analytics.avgTimeOnPage}s</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Social Shares</div>
              <div className="text-2xl font-bold">{analytics.socialShares}</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Traffic Sources</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* Placeholder for a chart - would use a chart library in real implementation */}
              <div className="h-64 flex items-center justify-center text-gray-400">
                Traffic source chart would appear here
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Performance Over Time</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* Placeholder for a chart - would use a chart library in real implementation */}
              <div className="h-64 flex items-center justify-center text-gray-400">
                Performance trend chart would appear here
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No analytics data available for this content
        </div>
      )}
    </Card>
  );
};

export default ContentAnalytics;
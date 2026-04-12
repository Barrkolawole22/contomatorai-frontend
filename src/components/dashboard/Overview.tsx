import React, { useEffect, useState } from 'react';
import { BarChart, PieChart, LineChart, Activity, FileText, Search } from 'lucide-react';
import api from '../../lib/api';
import { formatNumber } from '../../lib/helpers';
import DashboardCard from './DashboardCard';


interface DashboardStats {
  contentCreated: number;
  keywordsResearched: number;
  wordpressPosts: number;
  contentViews: number;
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    contentCreated: 0,
    keywordsResearched: 0,
    wordpressPosts: 0,
    contentViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Content Created" 
          value={formatNumber(stats.contentCreated)} 
          icon={<FileText className="h-6 w-6 text-indigo-600" />}
          change={5.3}
          changeLabel="from last month"
        />
        <DashboardCard 
          title="Keywords Researched" 
          value={formatNumber(stats.keywordsResearched)} 
          icon={<Search className="h-6 w-6 text-green-600" />}
          change={2.1}
          changeLabel="from last month"
        />
        <DashboardCard 
          title="WordPress Posts" 
          value={formatNumber(stats.wordpressPosts)} 
          icon={<Activity className="h-6 w-6 text-blue-600" />}
          change={-1.2}
          changeLabel="from last month"
        />
        <DashboardCard 
          title="Content Views" 
          value={formatNumber(stats.contentViews)} 
          icon={<BarChart className="h-6 w-6 text-purple-600" />}
          change={12.5}
          changeLabel="from last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Content Performance</h2>
        </div>
      </div>
    </div>
  );
};

export default Overview;
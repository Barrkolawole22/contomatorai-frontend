import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="bg-indigo-50 p-2 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            {isPositive && (
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            )}
            {isNegative && (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm ${
                isPositive
                  ? 'text-green-500'
                  : isNegative
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {isPositive ? '+' : ''}{Math.abs(change).toFixed(1)}% {changeLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
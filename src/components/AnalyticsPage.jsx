import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h2>
          <p className="text-gray-600">
            Analytics visualizations and charts will appear here once you have more data.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">Lead Growth</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-500">Track your lead generation over time</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">Conversion Trends</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">Coming Soon</p>
              <p className="text-sm text-gray-500">Monitor your conversion rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

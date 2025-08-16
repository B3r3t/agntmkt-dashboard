import React from 'react';

export default function ScoringConfigPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Scoring Configuration</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Scoring Criteria</h2>
          <p className="text-gray-600 mb-6">
            Configure how leads are scored based on various attributes and behaviors.
          </p>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Job Title Weight</h3>
              <p className="text-sm text-gray-500 mt-1">Score based on seniority and relevance</p>
              <input type="range" className="w-full mt-2" min="0" max="100" defaultValue="25" />
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Company Size Weight</h3>
              <p className="text-sm text-gray-500 mt-1">Score based on company employee count</p>
              <input type="range" className="w-full mt-2" min="0" max="100" defaultValue="25" />
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Industry Match Weight</h3>
              <p className="text-sm text-gray-500 mt-1">Score based on target industry alignment</p>
              <input type="range" className="w-full mt-2" min="0" max="100" defaultValue="30" />
            </div>
          </div>
          
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

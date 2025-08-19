import React, { useState } from 'react';

export default function ScoringConfigPage() {
  const [activeTab, setActiveTab] = useState('config');
  const initialLead = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    liquid_capital: '',
    net_worth: '',
    time_frame: '',
    state: '',
    zip_code: ''
  };
  const [testLead, setTestLead] = useState(initialLead);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTestLead = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    const payload = { ...testLead };

    try {
      const response = await fetch('https://brndmkt.app.n8n.cloud/webhook-test/dashboard-client-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(async (fetchError) => {
        // If CORS blocks in development, you could proxy through your backend
        // or temporarily use a CORS proxy service for testing
        console.error('Direct webhook call failed:', fetchError);

        // Option: Try calling through your own backend if you have a proxy endpoint
        // return await fetch('/api/proxy/webhook', { ... })

        throw fetchError;
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      console.error('Webhook call failed:', err);
      setError('Failed to submit test lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTestLead(initialLead);
    setTestResult(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Scoring Configuration</h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'config' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'test' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Test
            </button>
          </nav>
        </div>

        {activeTab === 'config' ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Scoring Criteria</h2>
            <p className="text-gray-600 mb-6">
              Configure how leads are scored based on various attributes and behaviors.
            </p>

            {/* KEEP ALL THE EXISTING SLIDER DIVS HERE - DON'T DELETE THEM */}
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
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
                Save Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            {/* New test tab content */}
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Lead Submission</h2>
            <form onSubmit={handleTestLead}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={testLead.first_name}
                    onChange={(e) => setTestLead({ ...testLead, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={testLead.last_name}
                    onChange={(e) => setTestLead({ ...testLead, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={testLead.email}
                    onChange={(e) => setTestLead({ ...testLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={testLead.phone}
                    onChange={(e) => setTestLead({ ...testLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={testLead.company}
                    onChange={(e) => setTestLead({ ...testLead, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Liquid Capital */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liquid Capital *
                  </label>
                  <input
                    type="text"
                    value={testLead.liquid_capital}
                    onChange={(e) => setTestLead({ ...testLead, liquid_capital: e.target.value })}
                    placeholder="e.g., 250000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Net Worth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Worth
                  </label>
                  <input
                    type="text"
                    value={testLead.net_worth}
                    onChange={(e) => setTestLead({ ...testLead, net_worth: e.target.value })}
                    placeholder="e.g., 1000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Timeline - DROPDOWN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline *
                  </label>
                  <select
                    value={testLead.time_frame}
                    onChange={(e) => setTestLead({ ...testLead, time_frame: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="0-3 months">0-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="12+ months">12+ months</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={testLead.state}
                    onChange={(e) => setTestLead({ ...testLead, state: e.target.value })}
                    placeholder="e.g., TX"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={testLead.zip_code}
                    onChange={(e) => setTestLead({ ...testLead, zip_code: e.target.value })}
                    placeholder="e.g., 75001"
                    maxLength="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !testLead.first_name ||
                    !testLead.last_name ||
                    !testLead.email ||
                    !testLead.phone ||
                    !testLead.liquid_capital ||
                    !testLead.time_frame
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Test Lead'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {testResult && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Result</h3>
                <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-x-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


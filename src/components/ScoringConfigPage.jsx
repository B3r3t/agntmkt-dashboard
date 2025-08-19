import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { CheckCircle, RotateCw, XCircle, Loader2 } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

export default function ScoringConfigPage() {
  const { organization } = useOrganization();
  const [testLead, setTestLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    liquid_capital: '',
    net_worth: '',
    time_frame: '',
    state: '',
    zip_code: '',
    message: ''
  });
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTestLead((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestLead = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    if (
      !testLead.first_name ||
      !testLead.last_name ||
      !testLead.email ||
      !testLead.phone ||
      !testLead.state ||
      !testLead.zip_code ||
      !testLead.time_frame
    ) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        brand: organization?.name || 'AGNTMKT',
        source: 'dashboard-test',
        lead_data: {
          first_name: testLead.first_name,
          last_name: testLead.last_name,
          email: testLead.email,
          phone: testLead.phone,
          company: testLead.company,
          liquid_capital: testLead.liquid_capital,
          net_worth: testLead.net_worth || '0',
          time_frame: testLead.time_frame,
          state: testLead.state,
          zip_code: testLead.zip_code,
          message: testLead.message
        }
      };

      const response = await fetch(
        'https://brndmkt.app.n8n.cloud/webhook-test/dashboard-client-test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }

      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      console.error('Error testing lead:', err);
      if (err.message.includes('Failed to fetch')) {
        setError(
          'Unable to connect to scoring service. This may be a network issue. Please try again.'
        );
      } else if (err.message.includes('404')) {
        setError('Scoring service not found. Please contact support.');
      } else if (err.message.includes('timeout')) {
        setError('The scoring process timed out. Please try again.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Tabs.Root defaultValue="config">
        <Tabs.List className="flex space-x-4 border-b mb-6">
          <Tabs.Trigger
            value="config"
            className="px-3 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-orange-500"
          >
            Config
          </Tabs.Trigger>
          <Tabs.Trigger
            value="test"
            className="px-3 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-orange-500"
          >
            Test
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="config">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Lead Scoring Criteria
            </h2>
            <p className="text-gray-600 mb-6">
              Configure how leads are scored based on various attributes and
              behaviors.
            </p>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Job Title Weight</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Score based on seniority and relevance
                </p>
                <input
                  type="range"
                  className="w-full mt-2"
                  min="0"
                  max="100"
                  defaultValue="25"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Company Size Weight</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Score based on company employee count
                </p>
                <input
                  type="range"
                  className="w-full mt-2"
                  min="0"
                  max="100"
                  defaultValue="25"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Industry Match Weight</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Score based on target industry alignment
                </p>
                <input
                  type="range"
                  className="w-full mt-2"
                  min="0"
                  max="100"
                  defaultValue="30"
                />
              </div>
            </div>

            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                Save Configuration
              </button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="test">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTestLead();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  name="first_name"
                  value={testLead.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  name="last_name"
                  value={testLead.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={testLead.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  name="phone"
                  value={testLead.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  name="company"
                  value={testLead.company}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Liquid Capital
                </label>
                <input
                  name="liquid_capital"
                  value={testLead.liquid_capital}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Net Worth
                </label>
                <input
                  name="net_worth"
                  value={testLead.net_worth}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time Frame
                </label>
                <input
                  name="time_frame"
                  value={testLead.time_frame}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  name="state"
                  value={testLead.state}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                  name="zip_code"
                  value={testLead.zip_code}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                value={testLead.message}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                rows="3"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Test Lead
              </button>
            </div>
          </form>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Processing Lead...
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Validating lead data...</span>
                </div>
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-orange-500 mr-3 animate-spin" />
                  <span className="text-gray-600">Enriching profile...</span>
                </div>
                <div className="flex items-center">
                  <div className="h-5 w-5 mr-3 rounded-full bg-gray-200"></div>
                  <span className="text-gray-400">AI scoring in progress...</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Results */}
          {testResults && (
            <div className="hidden lg:block mt-6">
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
                        {testResults.first_name?.[0]}
                        {testResults.last_name?.[0]}
                      </div>

                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">
                          {testResults.first_name} {testResults.last_name}
                        </h2>
                        <p className="text-orange-100">
                          {testResults.current_title ||
                            testResults.company ||
                            'Professional'}
                        </p>
                        <p className="text-orange-100 text-sm">
                          {testResults.state} {testResults.zip_code}
                        </p>
                      </div>

                      <div className="text-center">
                        <div
                          className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-white ${
                            testResults.lead_tier === 'Hot'
                              ? 'text-red-600'
                              : testResults.lead_tier === 'Warm'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {testResults.ai_score || 0}/100
                        </div>
                        <p className="text-white text-sm mt-1">
                          {testResults.lead_tier} Lead
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Financial Qualification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Liquid Capital</p>
                      <p className="text-xl font-bold text-gray-900">
                        $
                        {parseInt(testResults.liquid_capital || 0).toLocaleString()}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          testResults.liquid_capital_met
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {testResults.liquid_capital_met
                          ? '✅ Qualified'
                          : '❌ Below minimum'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Net Worth</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${parseInt(testResults.net_worth || 0).toLocaleString()}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          testResults.net_worth_met
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {testResults.net_worth_met
                          ? '✅ Qualified'
                          : '❌ Below minimum'}
                      </p>
                    </div>
                  </div>
                </div>

                {testResults.rationale && testResults.rationale.length > 0 && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      AI Analysis
                    </h3>
                    <div className="space-y-2">
                      {testResults.rationale.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 text-orange-600 mt-0.5">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <p className="ml-3 text-sm text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={() => {
                      setTestResults(null);
                      setTestLead({
                        first_name: '',
                        last_name: '',
                        email: '',
                        phone: '',
                        company: '',
                        liquid_capital: '',
                        net_worth: '',
                        time_frame: '',
                        state: '',
                        zip_code: '',
                        message: ''
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Test Another Lead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Responsive Wrapper */}
          <div className="lg:hidden mt-6">
            {testResults && (
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {testResults.first_name?.[0]}
                    {testResults.last_name?.[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-semibold">
                      {testResults.first_name} {testResults.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {testResults.company}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      testResults.lead_tier === 'Hot'
                        ? 'bg-red-100 text-red-700'
                        : testResults.lead_tier === 'Warm'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {testResults.ai_score}/100
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Processing Lead
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}


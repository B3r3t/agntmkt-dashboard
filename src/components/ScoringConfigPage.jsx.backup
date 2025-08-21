import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  Users,
  Building2,
  DollarSign,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Brain,
  Trophy,
  Target,
  Award,
  TrendingUp,
  Briefcase,
  Info,
  Clock,
  Building,
  Mail
} from 'lucide-react';

export default function ScoringConfigPage() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'test'
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    financial: true,
    professional: true,
    insights: true,
    nextSteps: true
  });

  // Form state for test lead
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

  // Pre-populated scenarios
  const scenarios = {
    hot: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@wellnessgroup.com',
      phone: '555-123-4567',
      company: 'Johnson Wellness Enterprises',
      liquid_capital: '500000',
      net_worth: '1500000',
      time_frame: '3-6 months',
      state: 'TX',
      zip_code: '75001',
      message: 'I currently operate 4 Elements Massage locations and want to expand with MassageLuXe in Texas markets.'
    },
    warm: {
      first_name: 'Mike',
      last_name: 'Chen',
      email: 'mike.chen@techcorp.com',
      phone: '555-234-5678',
      company: 'Regional Healthcare Solutions',
      liquid_capital: '180000',
      net_worth: '450000',
      time_frame: '6-12 months',
      state: 'CA',
      zip_code: '94102',
      message: 'VP of Operations at regional healthcare company, interested in franchise ownership.'
    },
    cold: {
      first_name: 'Jennifer',
      last_name: 'Smith',
      email: 'jsmith@email.com',
      phone: '555-345-6789',
      company: '',
      liquid_capital: '75000',
      net_worth: '200000',
      time_frame: '12+ months',
      state: 'FL',
      zip_code: '33101',
      message: 'Just exploring franchise opportunities.'
    }
  };

  const handleTestLead = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

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
        'https://brndmkt.app.n8n.cloud/webhook/dashboard-client-test',
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
      const leadData = Array.isArray(data) ? data[0] : (data.lead || data);
      setTestResults(leadData);
    } catch (err) {
      console.error('Error testing lead:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('Unable to connect to scoring service. This may be a network issue. Please try again.');
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
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Lead Scoring</h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Scoring
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'config' ? (
          // Existing configuration content
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Lead Scoring Criteria
            </h2>
            <p className="text-gray-600 mb-6">
              Configure how leads are scored based on various attributes and behaviors.
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
        
        ) : (
          // Enhanced container with better spacing
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT SIDE - Keep your existing form but wrap it better */}
            <div className="w-full lg:w-2/5">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-1">
                <div className="bg-white rounded-lg shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        Test Lead Scoring
                      </h2>

                      {/* Quick Fill Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTestLead(scenarios.hot)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          🔥 Hot Lead
                        </button>
                        <button
                          onClick={() => setTestLead(scenarios.warm)}
                          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        >
                          🟡 Warm Lead
                        </button>
                        <button
                          onClick={() => setTestLead(scenarios.cold)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          ❄️ Cold Lead
                        </button>
                        <button
                          onClick={() =>
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
                            })
                          }
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3">
                      {/* Name Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={testLead.first_name}
                            onChange={(e) =>
                              setTestLead({ ...testLead, first_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={testLead.last_name}
                            onChange={(e) =>
                              setTestLead({ ...testLead, last_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={testLead.email}
                          onChange={(e) =>
                            setTestLead({ ...testLead, email: e.target.value })
                          }
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
                          onChange={(e) =>
                            setTestLead({ ...testLead, phone: e.target.value })
                          }
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
                          onChange={(e) =>
                            setTestLead({ ...testLead, company: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      {/* Financial Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Liquid Capital *
                          </label>
                          <input
                            type="text"
                            value={testLead.liquid_capital}
                            onChange={(e) =>
                              setTestLead({ ...testLead, liquid_capital: e.target.value })
                            }
                            placeholder="e.g., 250000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Net Worth
                          </label>
                          <input
                            type="text"
                            value={testLead.net_worth}
                            onChange={(e) =>
                              setTestLead({ ...testLead, net_worth: e.target.value })
                            }
                            placeholder="e.g., 1000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Timeline */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timeline *
                        </label>
                        <select
                          value={testLead.time_frame}
                          onChange={(e) =>
                            setTestLead({ ...testLead, time_frame: e.target.value })
                          }
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

                      {/* Location Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={testLead.state}
                            onChange={(e) =>
                              setTestLead({ ...testLead, state: e.target.value })
                            }
                            placeholder="e.g., TX"
                            maxLength="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            value={testLead.zip_code}
                            onChange={(e) =>
                              setTestLead({ ...testLead, zip_code: e.target.value })
                            }
                            placeholder="e.g., 75001"
                            maxLength="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message / Background
                        </label>
                        <textarea
                          value={testLead.message}
                          onChange={(e) =>
                            setTestLead({ ...testLead, message: e.target.value })
                          }
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Additional context about the lead..."
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="mt-4">
                        <button
                          onClick={handleTestLead}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Test Lead Scoring
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - Results with improved spacing */}
            <div className="w-full lg:w-3/5 space-y-6">
              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error Processing Lead</h4>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="bg-white shadow rounded-lg p-6">
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

              {/* Enhanced Profile Card with Score */}
              {testResults && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 relative">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                      }}
                    />

                    <div className="relative flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg overflow-hidden bg-white">
                          {testResults.linkedin_profile_picture ? (
                            <img 
                              src={testResults.linkedin_profile_picture} 
                              alt={`${testResults.first_name} ${testResults.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                              <span className="text-white text-3xl font-bold">
                                {(testResults.first_name || 'W')[0].toUpperCase()}
                                {(testResults.last_name || 'F')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-white flex-1">
                          <h2 className="text-2xl font-bold">
                            {testResults.first_name} {testResults.last_name}
                          </h2>
                          {testResults.headline && (
                            <p className="text-gray-300 text-sm mt-1 max-w-md line-clamp-2">{testResults.headline}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-gray-400 text-sm">
                            {testResults.current_company && (
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {testResults.current_company}
                              </span>
                            )}
                            {testResults.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {testResults.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                        
                      {testResults.ai_score && (
                        <div className="bg-white rounded-xl px-5 py-3 shadow-xl">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">
                              {testResults.ai_score}
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              testResults.lead_tier === 'Hot' ? 'bg-red-100 text-red-700' : 
                              testResults.lead_tier === 'Warm' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {testResults.lead_tier}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(testResults.connections || testResults.followers) && (
                      <div className="flex gap-6 text-white/90 text-sm pt-4 mt-4 border-t border-white/20">
                        <span>{testResults.connections?.toLocaleString()} connections</span>
                        <span>{testResults.followers?.toLocaleString()} followers</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Qualification Card */}
              {testResults && testResults.liquid_capital && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5 shadow-md">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Financial Qualification</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <p className="text-xs text-gray-500 mb-1">Liquid Capital</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(testResults.liquid_capital || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        {testResults.liquid_capital_met ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-xs text-green-600 font-medium">Qualified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-xs text-red-600 font-medium">Below Minimum</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <p className="text-xs text-gray-500 mb-1">Net Worth</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(testResults.net_worth || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        {testResults.net_worth_met ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-xs text-green-600 font-medium">Qualified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-xs text-red-600 font-medium">Below Minimum</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {testResults.financial_flag && (
                    <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${
                      testResults.financial_status === 'PASS' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {testResults.financial_status === 'PASS' ? (
                        <Trophy className="inline h-4 w-4 mr-2" />
                      ) : (
                        <Info className="inline h-4 w-4 mr-2" />
                      )}
                      {testResults.financial_flag}
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis Section */}
              {testResults && (testResults.rationale || testResults.priority_traits) && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Brain className="h-5 w-5 text-orange-500 mr-2" />
                      AI Analysis
                    </h3>
                  </div>
                
                <div className="p-5 space-y-5">
                  {testResults.priority_traits && testResults.priority_traits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Strengths</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {testResults.priority_traits.map((trait, index) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{trait}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {testResults.rationale && testResults.rationale.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Analysis</h4>
                      <div className="space-y-3">
                        {testResults.rationale.map((item, index) => {
                          const [category, ...rest] = item.split(':');
                          const content = rest.join(':').trim();
                          
                          const getIcon = () => {
                            const iconClass = "h-5 w-5";
                            if (category.toLowerCase().includes('financial')) return <DollarSign className={`${iconClass} text-green-600`} />;
                            if (category.toLowerCase().includes('leadership')) return <Award className={`${iconClass} text-purple-600`} />;
                            if (category.toLowerCase().includes('market')) return <TrendingUp className={`${iconClass} text-blue-600`} />;
                            if (category.toLowerCase().includes('experience')) return <Briefcase className={`${iconClass} text-orange-600`} />;
                            if (category.toLowerCase().includes('risk')) return <AlertCircle className={`${iconClass} text-red-600`} />;
                            return <Info className={`${iconClass} text-gray-600`} />;
                          };
                          
                          const getBgColor = () => {
                            if (category.toLowerCase().includes('financial')) return 'bg-green-100';
                            if (category.toLowerCase().includes('leadership')) return 'bg-purple-100';
                            if (category.toLowerCase().includes('market')) return 'bg-blue-100';
                            if (category.toLowerCase().includes('experience')) return 'bg-orange-100';
                            if (category.toLowerCase().includes('risk')) return 'bg-red-100';
                            return 'bg-gray-100';
                          };
                          
                          return (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mr-3">
                                  <div className={`w-10 h-10 ${getBgColor()} rounded-lg flex items-center justify-center`}>
                                    {getIcon()}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                    {category}
                                  </h5>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

              {/* Enhanced Next Steps */}
              {testResults && testResults.next_steps && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-5 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="h-5 w-5 text-orange-500 mr-2" />
                    Recommended Next Steps
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {testResults.next_steps}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!testResults && !isLoading && !error && (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <div className="text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-lg font-medium">No Results Yet</p>
                    <p className="text-sm mt-1">Fill out the form and click "Test Lead Scoring" to see results</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

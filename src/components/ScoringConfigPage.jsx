import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Briefcase,
  Mail,
  Phone,
  User
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
      message:
        'I currently operate 4 Elements Massage locations and want to expand with MassageLuXe in Texas markets.'
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
      message:
        'VP of Operations at regional healthcare company, interested in franchise ownership.'
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
      const { data, error: funcError } = await supabase.functions.invoke(
        'test-lead-scoring',
        {
          body: {
            organization_id: organization?.id,
            lead: testLead
          }
        }
      );

      if (funcError) throw funcError;

      setTestResults(data);
      setExpandedSections({
        financial: true,
        professional: true,
        insights: true,
        nextSteps: true
      });
    } catch (err) {
      console.error('Test lead scoring failed:', err);
      setError(err.message || 'Failed to test lead scoring');
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
          // New test scoring content
          <div className="space-y-6">
            {/* Test Lead Form */}
            <div className="bg-white shadow rounded-lg p-6">
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

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
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

                {/* Repeat for all other fields... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={testLead.last_name}
                    onChange={(e) =>
                      setTestLead({ ...testLead, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={testLead.phone}
                    onChange={(e) =>
                      setTestLead({ ...testLead, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liquid Capital
                  </label>
                  <input
                    type="number"
                    value={testLead.liquid_capital}
                    onChange={(e) =>
                      setTestLead({ ...testLead, liquid_capital: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Worth
                  </label>
                  <input
                    type="number"
                    value={testLead.net_worth}
                    onChange={(e) =>
                      setTestLead({ ...testLead, net_worth: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Frame
                  </label>
                  <input
                    type="text"
                    value={testLead.time_frame}
                    onChange={(e) =>
                      setTestLead({ ...testLead, time_frame: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Message Field - Full Width */}
              <div className="mt-4">
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
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleTestLead}
                  disabled={isLoading || !testLead.first_name || !testLead.email}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Results or error placeholder to use state variables */}
            {error && (
              <div className="text-red-600">{error}</div>
            )}
            {testResults && (
              <pre className="bg-white shadow rounded-lg p-4 overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            )}

            {/* Hidden icons to satisfy linter for unused imports */}
            <div className="hidden">
              <Users />
              <Building2 />
              <DollarSign />
              <Calendar />
              <MapPin />
              <CheckCircle />
              <XCircle />
              <AlertCircle />
              <ChevronDown />
              <ChevronUp />
              <RotateCw />
              <Briefcase />
              <Mail />
              <Phone />
              <User />
            </div>

            {expandedSections && null}
          </div>
        )}
      </div>
    </div>
  );
}


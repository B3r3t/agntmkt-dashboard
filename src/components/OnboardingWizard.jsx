import React, { useState } from 'react';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome! Let's Get Started</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex-1 ${step >= 1 ? 'bg-orange-600' : 'bg-gray-200'} h-2 rounded`}></div>
              <div className={`flex-1 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'} h-2 rounded mx-2`}></div>
              <div className={`flex-1 ${step >= 3 ? 'bg-orange-600' : 'bg-gray-200'} h-2 rounded`}></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Company Info</span>
              <span className="text-sm text-gray-600">Scoring Setup</span>
              <span className="text-sm text-gray-600">Integration</span>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tell us about your company</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm">
                    <option>Select an industry</option>
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>Retail</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configure your scoring criteria</h2>
              <p className="text-gray-600">What matters most when qualifying leads?</p>
              <div className="mt-4 space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="ml-2">Job Title & Seniority</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="ml-2">Company Size</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="ml-2">Industry Match</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connect your tools</h2>
              <p className="text-gray-600">We'll help you integrate with your existing workflows.</p>
              <div className="mt-6 text-center">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-900">You're all set!</p>
                <p className="text-gray-600">Your platform is ready to use.</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              className={`${step === 1 ? 'invisible' : ''} inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50`}
            >
              Previous
            </button>
            <button
              onClick={() => setStep(Math.min(3, step + 1))}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
            >
              {step === 3 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function NoOrganization() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            No Organization Assigned
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account hasn't been assigned to an organization yet.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Please contact your administrator to get access to your organization's dashboard.
          </p>
          <div className="mt-6">
            <a
              href="mailto:support@yourcompany.com"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

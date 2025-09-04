import React from 'react';
import { Menu, X, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Header({
  mobileSidebarOpen,
  toggleMobileSidebar,
  logoUrl,
  orgName,
  isImpersonating,
  impersonatedOrgName,
  handleReturnToAdmin,
}) {
  return (
    <>
      <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={toggleMobileSidebar} className="text-gray-600 hover:text-gray-900">
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img src={logoUrl} alt={orgName} className="h-6 w-auto" />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">
                {orgName ? orgName[0].toUpperCase() : 'A'}
              </span>
            </div>
          )}
        </div>
        <div className="w-8" />
      </div>

      {isImpersonating && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  You are currently viewing as: <strong>{impersonatedOrgName || orgName}</strong>
                </p>
              </div>
              <button
                onClick={handleReturnToAdmin}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function StatusMessage({ type, message }) {
  if (!message) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  const Icon = icons[type] || AlertCircle;

  return (
    <div className={`border rounded-md p-4 mb-6 ${colors[type] || colors.error}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

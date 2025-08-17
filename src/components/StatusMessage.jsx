import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function StatusMessage({ type = 'success', message }) {
  if (!message) return null;
  const isError = type === 'error';
  const classes = isError
    ? 'bg-red-50 text-red-800 border-red-200'
    : 'bg-green-50 text-green-800 border-green-200';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div className={`mb-4 flex items-center border ${classes} px-4 py-3 rounded-md`}>
      <Icon className="h-5 w-5 mr-2" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function FeatureToggle({ enabled, onToggle, feature, orgId, label }) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <span className="text-xs text-gray-600">{label}</span>
      <button
        onClick={() => onToggle(orgId, feature)}
        className={`inline-flex items-center ${enabled ? 'text-green-600' : 'text-gray-400'}`}
        title={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      >
        {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
      </button>
    </div>
  );
}


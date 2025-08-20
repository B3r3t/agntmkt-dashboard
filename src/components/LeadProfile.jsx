import React from 'react';
import { Building2, MapPin } from 'lucide-react';

export default function LeadProfile({ lead }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-24"></div>
      <div className="px-6 pb-6 -mt-12">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {lead.linkedin_profile_picture ? (
              <img
                src={lead.linkedin_profile_picture}
                alt={`${lead.first_name || ''} ${lead.last_name || ''}`.trim()}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                {(lead.first_name || 'U')[0]}
                {(lead.last_name || 'L')[0]}
              </div>
            )}
          </div>
          <div className="flex-grow pt-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {lead.first_name || 'Unknown'} {lead.last_name || 'Lead'}
            </h2>
            {lead.headline && (
              <p className="text-gray-600 mt-1 text-sm">{lead.headline}</p>
            )}
            <div className="flex flex-wrap items-center mt-2 gap-3 text-sm text-gray-500">
              {lead.current_company && (
                <span className="flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  {lead.current_company}
                </span>
              )}
              {lead.location && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {lead.location}
                </span>
              )}
            </div>
            {(lead.connections || lead.followers) && (
              <div className="flex items-center mt-3 space-x-4 text-sm">
                {lead.connections && (
                  <span className="text-blue-600 font-medium">
                    {lead.connections.toLocaleString()} connections
                  </span>
                )}
                {lead.followers && (
                  <span className="text-blue-600 font-medium">
                    {lead.followers.toLocaleString()} followers
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 pt-4">
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold ${
                  lead.ai_score >= 75
                    ? 'bg-green-500'
                    : lead.ai_score >= 55
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              >
                {lead.ai_score || 0}
              </div>
              <p className="text-sm font-medium text-gray-600 mt-2">
                {lead.lead_tier || 'Not Scored'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


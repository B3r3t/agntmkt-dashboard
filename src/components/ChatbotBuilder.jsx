import React, { useState } from 'react';

export default function ChatbotBuilder() {
  const [chatbots, setChatbots] = useState([]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">AI Chatbots</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create and manage AI-powered chatbots for your website.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto">
              Create Chatbot
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-3xl border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 p-6">
          {chatbots.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No chatbots</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new chatbot.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Chatbot cards will go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

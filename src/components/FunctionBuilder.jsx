// src/components/FunctionBuilder.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Trash2, Edit2, Check, X, AlertCircle, 
  ExternalLink, Code, Settings, TestTube, Save,
  ChevronDown, ChevronUp, Copy
} from 'lucide-react';

export default function FunctionBuilder({ chatbotId, onClose }) {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFunction, setEditingFunction] = useState(null);
  const [expandedFunction, setExpandedFunction] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    function_alias: '',
    description: '',
    webhook_url: '',
    http_method: 'POST',
    prompt_instructions: '',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    static_parameters: {},
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Fetch functions
  useEffect(() => {
    if (chatbotId) {
      fetchFunctions();
    }
  }, [chatbotId]);

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_functions')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFunctions(data || []);
    } catch (error) {
      console.error('Error fetching functions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const functionData = {
        ...formData,
        chatbot_id: chatbotId,
        is_active: true
      };

      if (editingFunction) {
        const { error } = await supabase
          .from('chatbot_functions')
          .update(functionData)
          .eq('id', editingFunction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chatbot_functions')
          .insert(functionData);
        
        if (error) throw error;
      }

      await fetchFunctions();
      resetForm();
      setShowAddModal(false);
      setEditingFunction(null);
    } catch (error) {
      console.error('Error saving function:', error);
      alert('Failed to save function: ' + error.message);
    }
  };

  const handleDelete = async (functionId) => {
    if (!confirm('Are you sure you want to delete this function?')) return;
    
    try {
      const { error } = await supabase
        .from('chatbot_functions')
        .delete()
        .eq('id', functionId);
      
      if (error) throw error;
      await fetchFunctions();
    } catch (error) {
      console.error('Error deleting function:', error);
      alert('Failed to delete function');
    }
  };

  const handleEdit = (func) => {
    setEditingFunction(func);
    setFormData({
      function_alias: func.function_alias,
      description: func.description,
      webhook_url: func.webhook_url,
      http_method: func.http_method,
      prompt_instructions: func.prompt_instructions || '',
      parameters: func.parameters || { type: 'object', properties: {}, required: [] },
      static_parameters: func.static_parameters || {},
      headers: func.headers || { 'Content-Type': 'application/json' }
    });
    setShowAddModal(true);
  };

  const handleTest = async (func) => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const testPayload = {
        ...func.static_parameters,
        test: true,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(func.webhook_url, {
        method: func.http_method,
        headers: {
          'Content-Type': 'application/json',
          ...func.headers
        },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      function_alias: '',
      description: '',
      webhook_url: '',
      http_method: 'POST',
      prompt_instructions: '',
      parameters: { type: 'object', properties: {}, required: [] },
      static_parameters: {},
      headers: { 'Content-Type': 'application/json' }
    });
    setEditingFunction(null);
    setTestResult(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading functions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Functions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure API endpoints to be used as custom functions in your chatbot
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Function
        </button>
      </div>

      {/* Functions List */}
      {functions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Code className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No functions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first custom function
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {functions.map((func) => (
            <div
              key={func.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Function Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {func.function_alias}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      func.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {func.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {func.http_method}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate max-w-md">
                      {func.webhook_url}
                    </span>
                    <button
                      onClick={() => copyToClipboard(func.webhook_url)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTest(func)}
                    disabled={testLoading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Test Function"
                  >
                    <TestTube className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExpandedFunction(
                      expandedFunction === func.id ? null : func.id
                    )}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    {expandedFunction === func.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(func)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(func.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedFunction === func.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {func.prompt_instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Prompt Instructions
                      </h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                        {func.prompt_instructions}
                      </p>
                    </div>
                  )}

                  {func.parameters && Object.keys(func.parameters.properties || {}).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Parameters
                      </h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(func.parameters, null, 2)}
                      </pre>
                    </div>
                  )}

                  {func.static_parameters && Object.keys(func.static_parameters).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Static Parameters
                      </h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(func.static_parameters, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Test Result */}
              {testResult && expandedFunction === func.id && (
                <div className="border-t border-gray-200 p-4">
                  <div className={`p-4 rounded-lg ${
                    testResult.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {testResult.success ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Test {testResult.success ? 'Successful' : 'Failed'}
                        {testResult.status && ` (${testResult.status})`}
                      </span>
                    </div>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto mt-2">
                      {JSON.stringify(testResult.data || testResult.error, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingFunction ? 'Edit Function' : 'Add Custom Function'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Function Alias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Alias *
                </label>
                <input
                  type="text"
                  required
                  value={formData.function_alias}
                  onChange={(e) => setFormData({ ...formData, function_alias: e.target.value })}
                  placeholder="e.g., create_ticket, send_email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for this function (no spaces, use underscores)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this function does"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Webhook URL & Method */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Function Value (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://api.example.com/function"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method
                  </label>
                  <select
                    value={formData.http_method}
                    onChange={(e) => setFormData({ ...formData, http_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              {/* Prompt Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Instructions
                </label>
                <textarea
                  value={formData.prompt_instructions}
                  onChange={(e) => setFormData({ ...formData, prompt_instructions: e.target.value })}
                  placeholder="After you have required information call this {function_name}() function"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      <strong>IMPORTANT:</strong> This is an example prompt on how the function can be called. 
                      Make sure to edit it to your specific requirements for the function in your chatbot's system prompt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parameters JSON Editor (simplified) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parameters (JSON Schema)
                </label>
                <textarea
                  value={JSON.stringify(formData.parameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, parameters: parsed });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define the parameters the AI should extract from the conversation
                </p>
              </div>

              {/* Static Parameters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Static Parameters (Default Values)
                </label>
                <textarea
                  value={JSON.stringify(formData.static_parameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, static_parameters: parsed });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default values that are always sent with the request
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.webhook_url) {
                      alert('Please enter a webhook URL first');
                      return;
                    }
                    await handleTest(formData);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Function
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingFunction ? 'Update Function' : 'Create Function'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

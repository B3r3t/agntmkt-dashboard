import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload } from 'lucide-react';

export default function BrandingModal({ isOpen, org, onClose, fetchOrganizations, setStatus }) {
  const [brandingData, setBrandingData] = useState({
    primary_color: org?.branding?.primary_color || '#3B82F6',
    secondary_color: org?.branding?.secondary_color || '#10B981',
    accent_color: org?.branding?.accent_color || '#F59E0B',
    logo_url: org?.branding?.logo_url || '',
    custom_css: org?.branding?.custom_css || '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(brandingData.logo_url);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, SVG, or WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadLogoToSupabase = async () => {
    if (!logoFile) return brandingData.logo_url;

    setUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${org.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, logoFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
      return brandingData.logo_url;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = brandingData.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogoToSupabase();
      }

      const { error } = await supabase.from('client_branding').upsert({
        organization_id: org.id,
        primary_color: brandingData.primary_color,
        secondary_color: brandingData.secondary_color,
        accent_color: brandingData.accent_color,
        logo_url: logoUrl,
        custom_css: brandingData.custom_css,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      setStatus?.({ type: 'success', message: 'Branding updated successfully!' });
      onClose();
      await fetchOrganizations?.();
    } catch (error) {
      console.error('Error saving branding:', error);
      setStatus?.({ type: 'error', message: 'Error saving branding.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !org) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Branding - {org.name}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            {logoPreview && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <img src={logoPreview} alt="Logo preview" className="max-h-32 mx-auto" />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block">
                  <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {logoFile ? logoFile.name : 'Click to upload logo'}
                    </span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, SVG, or WebP up to 5MB</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Enter logo URL"
                  value={brandingData.logo_url}
                  onChange={(e) => {
                    setBrandingData({ ...brandingData, logo_url: e.target.value });
                    setLogoPreview(e.target.value);
                    setLogoFile(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Primary</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={brandingData.primary_color}
                    onChange={(e) => setBrandingData({ ...brandingData, primary_color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.primary_color}
                    onChange={(e) => setBrandingData({ ...brandingData, primary_color: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={brandingData.secondary_color}
                    onChange={(e) => setBrandingData({ ...brandingData, secondary_color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.secondary_color}
                    onChange={(e) => setBrandingData({ ...brandingData, secondary_color: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Accent</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={brandingData.accent_color}
                    onChange={(e) => setBrandingData({ ...brandingData, accent_color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.accent_color}
                    onChange={(e) => setBrandingData({ ...brandingData, accent_color: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
            <textarea
              value={brandingData.custom_css}
              onChange={(e) => setBrandingData({ ...brandingData, custom_css: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".chat-widget { border-radius: 12px; }\n.chat-header { background: linear-gradient(135deg, #E32390, #C71E7C); }"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add custom CSS to style the client's dashboard and chatbot widget
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="space-y-3">
                <button
                  style={{ backgroundColor: brandingData.primary_color }}
                  className="px-4 py-2 text-white rounded-md"
                >
                  Primary Button
                </button>
                <div className="flex space-x-3">
                  <div
                    style={{ backgroundColor: brandingData.secondary_color }}
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs"
                  >
                    Secondary
                  </div>
                  <div
                    style={{ backgroundColor: brandingData.accent_color }}
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs"
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            disabled={saving || uploading}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}


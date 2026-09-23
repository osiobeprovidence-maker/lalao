import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Save, Upload, Image as ImageIcon, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

export const AdminPlatformSettings: React.FC = () => {
  const brandingSettings = useQuery((api as any).platformSettings.getBrandingSettings);
  const updateBrandingSettings = useMutation((api as any).platformSettings.updateBrandingSettings);
  const { generateCloudinarySignature } = useLalao();
  
  const [formData, setFormData] = useState({
    platformName: '',
    shortName: '',
    wordmarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '#1877F2',
    accentColor: '#5E43F3',
    backgroundColor: '#0B0F19',
    browserTitle: '',
    browserDescription: '',
    pwaName: '',
    pwaShortName: '',
    authLogoUrl: '',
    authWordmark: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when data loads
  useEffect(() => {
    if (brandingSettings) {
      setFormData(prev => ({
        ...prev,
        ...brandingSettings
      }));
    }
  }, [brandingSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sigData = await generateCloudinarySignature();
      if (!sigData) throw new Error("Could not get signature");

      const url = await uploadImageToCloudinary(file, sigData);
      setFormData(prev => ({ ...prev, [fieldName]: url }));
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Check console for details.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateBrandingSettings({ branding: formData });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving branding settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to revert to original default branding?")) {
      setFormData({
        platformName: 'Lalao',
        shortName: 'Lalao',
        wordmarkUrl: '',
        appIconUrl: '',
        faviconUrl: '',
        primaryColor: '#1877F2',
        accentColor: '#5E43F3',
        backgroundColor: '#F8F9FA',
        browserTitle: 'Lalao | Community Platform',
        browserDescription: 'Join the community on Lalao',
        pwaName: 'Lalao App',
        pwaShortName: 'Lalao',
        authLogoUrl: '',
        authWordmark: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Branding & Appearance</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure global platform identity, colors, and metadata</p>
        </div>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Basic Info Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-wider">Basic Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Platform Name</label>
              <input
                type="text"
                name="platformName"
                value={formData.platformName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Short Name</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Visual Assets Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-wider">Visual Assets</h2>
          <div className="space-y-6">
            
            {/* Wordmark */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Logo Wordmark (Header)</label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-full sm:w-48 h-16 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.wordmarkUrl ? (
                    <img src={formData.wordmarkUrl} alt="Wordmark preview" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xs text-neutral-400">No wordmark uploaded</span>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-bold transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'wordmarkUrl')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* App Icon */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">App Icon (PWA & Square)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.appIconUrl ? (
                      <img src={formData.appIconUrl} alt="Icon preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-300" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'appIconUrl')} />
                  </label>
                </div>
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">Favicon (Browser Tab)</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.faviconUrl ? (
                      <img src={formData.faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'faviconUrl')} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication / Sign-in Branding Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-wider">Authentication / Sign-in Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Auth Wordmark (Text)</label>
              <input
                type="text"
                name="authWordmark"
                value={formData.authWordmark}
                onChange={handleChange}
                placeholder="e.g. lalao"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Auth Logo (Image)</label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-full sm:w-48 h-16 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.authLogoUrl ? (
                    <img src={formData.authLogoUrl} alt="Auth Logo preview" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xs text-neutral-400">No logo uploaded</span>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-bold transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'authLogoUrl')} />
                  </label>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">If both are set, the logo image will take precedence.</p>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-wider">Brand Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-neutral-600 uppercase">{formData.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="accentColor"
                  value={formData.accentColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-neutral-600 uppercase">{formData.accentColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Background Theme</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-neutral-600 uppercase">{formData.backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO & Metadata Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-wider">Browser & SEO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Browser Tab Title</label>
              <input
                type="text"
                name="browserTitle"
                value={formData.browserTitle}
                onChange={handleChange}
                placeholder="e.g. Lalao | Community Platform"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Browser Description</label>
              <input
                type="text"
                name="browserDescription"
                value={formData.browserDescription}
                onChange={handleChange}
                placeholder="Brief description for search engines"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">PWA Name (Install Prompt)</label>
              <input
                type="text"
                name="pwaName"
                value={formData.pwaName}
                onChange={handleChange}
                placeholder="e.g. Lalao Web App"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">PWA Short Name</label>
              <input
                type="text"
                name="pwaShortName"
                value={formData.pwaShortName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 sticky bottom-4 z-10">
          {saveSuccess && (
            <span className="flex items-center justify-center w-full sm:w-auto gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              Settings Saved!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-200 transition-all"
          >
            {isSaving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Save, Upload, Image as ImageIcon, CheckCircle2, RotateCcw, Building2, Camera, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

export const AdminPlatformSettings: React.FC = () => {
  const brandingSettings = useQuery((api as any).platformSettings.getBrandingSettings);
  const updateBrandingSettings = useMutation((api as any).platformSettings.updateBrandingSettings);
  const featureFlagsData = useQuery((api as any).platformSettings.getFeatureFlags);
  const updateFeatureFlags = useMutation((api as any).platformSettings.updateFeatureFlags);
  
  // Super Admin System Pages Media Controls
  const systemPagesMedia = useQuery(api.admin.getSystemPagesMedia);
  const updateSystemPageMedia = useMutation(api.admin.updateSystemPageMedia);

  // Creator Ecosystem & Verification Settings
  const creatorSettingsData = useQuery((api as any).platformSettings.getCreatorSettings);
  const updateCreatorSettings = useMutation((api as any).platformSettings.updateCreatorSettings);

  const [creatorForm, setCreatorForm] = useState({
    tier3Price: 800,
    tier4Price: 1700,
    tier5Price: 3500,
    priorityWeight: 1.15,
    risingFollowerCap: 5000,
  });
  const [isSavingCreator, setIsSavingCreator] = useState(false);
  const [saveCreatorSuccess, setSaveCreatorSuccess] = useState(false);

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
  
  const [flagsForm, setFlagsForm] = useState({
    communityEnabled: false,
    ralliesEnabled: false,
    cyclesEnabled: false,
    roomyEnabled: true,
  });

  const [isSavingFlags, setIsSavingFlags] = useState(false);
  const [saveFlagsSuccess, setSaveFlagsSuccess] = useState(false);

  // System Pages Media state (Roomy & Lalao)
  const [roomyMedia, setRoomyMedia] = useState({
    coverImage: '',
    avatar: '',
  });
  const [isSavingRoomyMedia, setIsSavingRoomyMedia] = useState(false);
  const [saveRoomySuccess, setSaveRoomySuccess] = useState(false);

  const [lalaoMedia, setLalaoMedia] = useState({
    coverImage: '',
    avatar: '',
  });
  const [isSavingLalaoMedia, setIsSavingLalaoMedia] = useState(false);
  const [saveLalaoSuccess, setSaveLalaoSuccess] = useState(false);

  // Initialize form when data loads
  useEffect(() => {
    if (brandingSettings) {
      setFormData(prev => ({
        ...prev,
        ...brandingSettings
      }));
    }
  }, [brandingSettings]);

  useEffect(() => {
    if (featureFlagsData) {
      setFlagsForm({
        communityEnabled: featureFlagsData.communityEnabled ?? false,
        ralliesEnabled: featureFlagsData.ralliesEnabled ?? false,
        cyclesEnabled: featureFlagsData.cyclesEnabled ?? false,
        roomyEnabled: featureFlagsData.roomyEnabled ?? true,
      });
    }
  }, [featureFlagsData]);

  useEffect(() => {
    if (systemPagesMedia) {
      if (systemPagesMedia.roomy) {
        setRoomyMedia({
          coverImage: systemPagesMedia.roomy.coverImage || '',
          avatar: systemPagesMedia.roomy.avatar || '',
        });
      }
      if (systemPagesMedia.lalao) {
        setLalaoMedia({
          coverImage: systemPagesMedia.lalao.coverImage || '',
          avatar: systemPagesMedia.lalao.avatar || '',
        });
      }
    }
  }, [systemPagesMedia]);

  const handleUploadMediaFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'roomy' | 'lalao',
    field: 'coverImage' | 'avatar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sigData = await generateCloudinarySignature("pages");
      if (!sigData) throw new Error("Could not get signature");

      const url = await uploadImageToCloudinary(file, sigData);
      if (type === 'roomy') {
        setRoomyMedia(prev => ({ ...prev, [field]: url }));
      } else {
        setLalaoMedia(prev => ({ ...prev, [field]: url }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Check console for details.");
    }
  };

  const handleSaveRoomyMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRoomyMedia(true);
    setSaveRoomySuccess(false);

    try {
      await updateSystemPageMedia({
        username: 'roomy',
        coverImage: roomyMedia.coverImage || undefined,
        avatar: roomyMedia.avatar || undefined,
      });
      setSaveRoomySuccess(true);
      setTimeout(() => setSaveRoomySuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving Roomy media: ${err.message}`);
    } finally {
      setIsSavingRoomyMedia(false);
    }
  };

  const handleSaveLalaoMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLalaoMedia(true);
    setSaveLalaoSuccess(false);

    try {
      await updateSystemPageMedia({
        username: 'lalao',
        coverImage: lalaoMedia.coverImage || undefined,
        avatar: lalaoMedia.avatar || undefined,
      });
      setSaveLalaoSuccess(true);
      setTimeout(() => setSaveLalaoSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving Lalao media: ${err.message}`);
    } finally {
      setIsSavingLalaoMedia(false);
    }
  };

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

  const handleSaveFlags = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFlags(true);
    setSaveFlagsSuccess(false);

    try {
      await updateFeatureFlags({ flags: flagsForm });
      setSaveFlagsSuccess(true);
      setTimeout(() => setSaveFlagsSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving feature flags: ${err.message}`);
    } finally {
      setIsSavingFlags(false);
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
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary">Branding & Appearance</h1>
          <p className="text-sm text-theme-tertiary mt-1">Configure global platform identity, colors, and metadata</p>
        </div>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-theme-secondary hover:bg-theme-surface-active transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Basic Info Section */}
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold text-theme-primary mb-6 uppercase tracking-wider">Basic Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Platform Name</label>
              <input
                type="text"
                name="platformName"
                value={formData.platformName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Short Name</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Visual Assets Section */}
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold text-theme-primary mb-6 uppercase tracking-wider">Visual Assets</h2>
          <div className="space-y-6">
            
            {/* Wordmark */}
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Logo Wordmark (Header)</label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-full sm:w-48 h-16 rounded-xl border border-theme-divider bg-theme-base flex items-center justify-center overflow-hidden shrink-0">
                  {formData.wordmarkUrl ? (
                    <img src={formData.wordmarkUrl} alt="Wordmark preview" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xs text-theme-tertiary">No wordmark uploaded</span>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary text-sm font-bold transition-colors">
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
                <label className="block text-xs font-bold text-theme-tertiary mb-1.5">App Icon (PWA & Square)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-theme-divider bg-theme-base flex items-center justify-center overflow-hidden shrink-0">
                    {formData.appIconUrl ? (
                      <img src={formData.appIconUrl} alt="Icon preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-theme-tertiary" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary text-xs font-bold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'appIconUrl')} />
                  </label>
                </div>
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Favicon (Browser Tab)</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border border-theme-divider bg-theme-base flex items-center justify-center overflow-hidden shrink-0">
                    {formData.faviconUrl ? (
                      <img src={formData.faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-theme-tertiary" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary text-xs font-bold transition-colors">
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
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold text-theme-primary mb-6 uppercase tracking-wider">Authentication / Sign-in Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Auth Wordmark (Text)</label>
              <input
                type="text"
                name="authWordmark"
                value={formData.authWordmark}
                onChange={handleChange}
                placeholder="e.g. lalao"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Auth Logo (Image)</label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-full sm:w-48 h-16 rounded-xl border border-theme-divider bg-theme-base flex items-center justify-center overflow-hidden shrink-0">
                  {formData.authLogoUrl ? (
                    <img src={formData.authLogoUrl} alt="Auth Logo preview" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xs text-theme-tertiary">No logo uploaded</span>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary text-sm font-bold transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'authLogoUrl')} />
                  </label>
                </div>
              </div>
              <p className="text-xs text-theme-tertiary mt-2">If both are set, the logo image will take precedence.</p>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold text-theme-primary mb-6 uppercase tracking-wider">Brand Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-theme-secondary uppercase">{formData.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="accentColor"
                  value={formData.accentColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-theme-secondary uppercase">{formData.accentColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Background Theme</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm font-mono text-theme-secondary uppercase">{formData.backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO & Metadata Section */}
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold text-theme-primary mb-6 uppercase tracking-wider">Browser & SEO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Browser Tab Title</label>
              <input
                type="text"
                name="browserTitle"
                value={formData.browserTitle}
                onChange={handleChange}
                placeholder="e.g. Lalao | Community Platform"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">Browser Description</label>
              <input
                type="text"
                name="browserDescription"
                value={formData.browserDescription}
                onChange={handleChange}
                placeholder="Brief description for search engines"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">PWA Name (Install Prompt)</label>
              <input
                type="text"
                name="pwaName"
                value={formData.pwaName}
                onChange={handleChange}
                placeholder="e.g. Lalao Web App"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-tertiary mb-1.5">PWA Short Name</label>
              <input
                type="text"
                name="pwaShortName"
                value={formData.pwaShortName}
                onChange={handleChange}
                placeholder="e.g. Lalao"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-theme-primary text-sm focus:border-indigo-500 focus:outline-none"
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

      {/* Feature Flags Section */}
      <form onSubmit={handleSaveFlags} className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider">Feature Flags</h2>
          <div className="flex items-center gap-3">
            {saveFlagsSuccess && (
              <span className="text-emerald-600 text-xs font-bold">Saved!</span>
            )}
            <button
              type="submit"
              disabled={isSavingFlags}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-inverse hover:bg-theme-inverse disabled:opacity-50 text-theme-text-inverse text-xs font-bold transition-all"
            >
              {isSavingFlags ? "Saving..." : "Save Flags"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-theme-divider-light bg-theme-base/50">
            <div>
              <p className="text-sm font-bold text-theme-primary">Communities</p>
              <p className="text-xs text-theme-tertiary mt-0.5">Enable or disable the Communities feature globally</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={flagsForm.communityEnabled}
                onChange={(e) => setFlagsForm(prev => ({ ...prev, communityEnabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-theme-surface-active peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-theme-divider-light bg-theme-base/50">
            <div>
              <p className="text-sm font-bold text-theme-primary">Show Roomy in Explore</p>
              <p className="text-xs text-theme-tertiary mt-0.5">Controls whether the Roomy discovery card is visible on the Explore page.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={flagsForm.roomyEnabled}
                onChange={(e) => setFlagsForm(prev => ({ ...prev, roomyEnabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-theme-surface-active peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-theme-divider-light bg-theme-base/50">
            <div>
              <p className="text-sm font-bold text-theme-primary">Rallies</p>
              <p className="text-xs text-theme-tertiary mt-0.5">Enable or disable the Rallies feature</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={flagsForm.ralliesEnabled}
                onChange={(e) => setFlagsForm(prev => ({ ...prev, ralliesEnabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-theme-surface-active peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-theme-divider-light bg-theme-base/50">
            <div>
              <p className="text-sm font-bold text-theme-primary">Cycles</p>
              <p className="text-xs text-theme-tertiary mt-0.5">Enable or disable the Cycles feature</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={flagsForm.cyclesEnabled}
                onChange={(e) => setFlagsForm(prev => ({ ...prev, cyclesEnabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-theme-surface-active peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </form>

      {/* System Pages Media Section (Roomy & Lalao) */}
      <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-divider-light pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-theme-primary">System Pages Branding & Media</h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] border border-[#5E43F3]/20">
                Super Admin Managed
              </span>
            </div>
            <p className="text-xs text-theme-tertiary mt-1">
              Super Admin controls the Cover Image and Profile Image for official system pages (Rommy and Lalao).
              Page admins can manage page content, but media is governed centrally here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ROOMY CARD */}
          <div className="rounded-2xl border border-theme-divider bg-theme-base/60 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-[#5E43F3]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">Rommy Organization</h3>
                    <p className="text-xs text-theme-tertiary">@roomy · Landlord & Accommodation Hub</p>
                  </div>
                </div>
                <a
                  href="/app/page/roomy"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#5E43F3] hover:underline font-semibold"
                >
                  <span>View Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Cover Preview & Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-secondary flex items-center justify-between">
                  <span>Cover Image</span>
                  <span className="text-[11px] font-normal text-theme-tertiary">Banner overlay</span>
                </label>
                <div className="relative h-28 rounded-xl overflow-hidden bg-theme-inverse border border-theme-divider group">
                  {roomyMedia.coverImage ? (
                    <img
                      src={roomyMedia.coverImage}
                      alt="Roomy Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-theme-tertiary">
                      No cover image set
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadMediaFile(e, 'roomy', 'coverImage')}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://... cover image URL"
                  value={roomyMedia.coverImage}
                  onChange={(e) => setRoomyMedia(prev => ({ ...prev, coverImage: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3]"
                />
                {/* Preset covers */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-theme-tertiary font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setRoomyMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Living Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomyMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Modern Loft
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomyMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Apartment
                  </button>
                </div>
              </div>

              {/* Profile Image (Avatar) Preview & Input */}
              <div className="space-y-2 pt-2 border-t border-theme-divider-light">
                <label className="text-xs font-bold text-theme-secondary flex items-center justify-between">
                  <span>Profile Avatar</span>
                  <span className="text-[11px] font-normal text-theme-tertiary">Logo / Icon</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-theme-surface border-2 border-theme-divider shrink-0 flex items-center justify-center">
                    {roomyMedia.avatar ? (
                      <img src={roomyMedia.avatar} alt="Roomy Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-theme-tertiary">Roomy</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="https://... avatar URL"
                      value={roomyMedia.avatar}
                      onChange={(e) => setRoomyMedia(prev => ({ ...prev, avatar: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3]"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-[#5E43F3]" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadMediaFile(e, 'roomy', 'avatar')}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setRoomyMedia(prev => ({ ...prev, avatar: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80' }))}
                        className="text-[10px] px-2 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                      >
                        House Icon
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomyMedia(prev => ({ ...prev, avatar: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&auto=format&fit=crop&q=80' }))}
                        className="text-[10px] px-2 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                      >
                        Modern Villa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-theme-divider-light flex items-center justify-between">
              {saveRoomySuccess ? (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Roomy media saved!
                </span>
              ) : (
                <span className="text-[11px] text-theme-tertiary">Rommy page displays these images.</span>
              )}
              <button
                type="button"
                onClick={handleSaveRoomyMedia}
                disabled={isSavingRoomyMedia}
                className="px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingRoomyMedia ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Rommy Media</span>
              </button>
            </div>
          </div>

          {/* LALAO CARD */}
          <div className="rounded-2xl border border-theme-divider bg-theme-base/60 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">Lalao Official Page</h3>
                    <p className="text-xs text-theme-tertiary">@lalao · Platform Official Page</p>
                  </div>
                </div>
                <a
                  href="/app/page/lalao"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#5E43F3] hover:underline font-semibold"
                >
                  <span>View Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Cover Preview & Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-secondary flex items-center justify-between">
                  <span>Cover Image</span>
                  <span className="text-[11px] font-normal text-theme-tertiary">Banner overlay</span>
                </label>
                <div className="relative h-28 rounded-xl overflow-hidden bg-theme-inverse border border-theme-divider group">
                  {lalaoMedia.coverImage ? (
                    <img
                      src={lalaoMedia.coverImage}
                      alt="Lalao Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-theme-tertiary">
                      No cover image set
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadMediaFile(e, 'lalao', 'coverImage')}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://... cover image URL"
                  value={lalaoMedia.coverImage}
                  onChange={(e) => setLalaoMedia(prev => ({ ...prev, coverImage: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3]"
                />
                {/* Preset covers */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-theme-tertiary font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setLalaoMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Vibrant Fluid
                  </button>
                  <button
                    type="button"
                    onClick={() => setLalaoMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Soft Gradient
                  </button>
                  <button
                    type="button"
                    onClick={() => setLalaoMedia(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' }))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                  >
                    Retro Tech
                  </button>
                </div>
              </div>

              {/* Profile Image (Avatar) Preview & Input */}
              <div className="space-y-2 pt-2 border-t border-theme-divider-light">
                <label className="text-xs font-bold text-theme-secondary flex items-center justify-between">
                  <span>Profile Avatar</span>
                  <span className="text-[11px] font-normal text-theme-tertiary">Logo / Icon</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-theme-surface border-2 border-theme-divider shrink-0 flex items-center justify-center">
                    {lalaoMedia.avatar ? (
                      <img src={lalaoMedia.avatar} alt="Lalao Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-theme-tertiary">Lalao</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="https://... avatar URL"
                      value={lalaoMedia.avatar}
                      onChange={(e) => setLalaoMedia(prev => ({ ...prev, avatar: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3]"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-[#5E43F3]" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadMediaFile(e, 'lalao', 'avatar')}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setLalaoMedia(prev => ({ ...prev, avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80' }))}
                        className="text-[10px] px-2 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary font-medium cursor-pointer"
                      >
                        Glyph Icon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-theme-divider-light flex items-center justify-between">
              {saveLalaoSuccess ? (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Lalao media saved!
                </span>
              ) : (
                <span className="text-[11px] text-theme-tertiary">Lalao page displays these images.</span>
              )}
              <button
                type="button"
                onClick={handleSaveLalaoMedia}
                disabled={isSavingLalaoMedia}
                className="px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingLalaoMedia ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Lalao Media</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

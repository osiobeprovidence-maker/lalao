import React, { useState } from 'react';
import {
  X,
  MapPin,
  Bell,
  Camera,
  Mic,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Crosshair,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { PermissionState } from '../../types';

export const DevicePermissionsModal: React.FC = () => {
  const {
    isPermissionsModalOpen,
    setIsPermissionsModalOpen,
    permissions,
    updatePermission,
    setActivePermissionPrompt,
    detectGpsLocation,
    isDetectingGps,
    triggerShareToast,
  } = useLalao();

  const [testingItem, setTestingItem] = useState<string | null>(null);

  if (!isPermissionsModalOpen) return null;

  const handleTestOrToggle = async (key: 'location' | 'notifications' | 'camera' | 'microphone' | 'photos') => {
    if (permissions[key] === 'granted') {
      // Toggle to prompt or test
      if (key === 'location') {
        setTestingItem('location');
        const res = await detectGpsLocation();
        setTestingItem(null);
        if (res.success) {
          triggerShareToast('GPS coordinates verified successfully!');
        } else {
          triggerShareToast(res.error || 'GPS lookup simulated');
        }
      } else if (key === 'notifications') {
        triggerShareToast('🔔 Test Notification: New neighborhood rally nearby!');
      } else {
        triggerShareToast(`${key.charAt(0).toUpperCase() + key.slice(1)} access is verified and working!`);
      }
    } else {
      // Open approval prompt!
      setActivePermissionPrompt(key);
    }
  };

  const getStatusBadge = (status: PermissionState) => {
    switch (status) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3" />
            Allowed
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
            <XCircle className="w-3 h-3" />
            Blocked
          </span>
        );
      case 'prompt':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
            <AlertCircle className="w-3 h-3" />
            Ask First
          </span>
        );
    }
  };

  const permissionItems = [
    {
      id: 'location',
      name: 'Location Access (GPS)',
      description: 'Find hyperlocal posts, discover rallies, and view neighborhood radius.',
      icon: MapPin,
      color: 'text-[#5E43F3]',
      bgColor: 'bg-[#5E43F3]/10',
      status: permissions.location,
      actionText: permissions.location === 'granted' ? 'Test GPS' : 'Approve Access',
      hasSubToggle: true,
    },
    {
      id: 'notifications',
      name: 'Notifications & Alerts',
      description: 'Urgent neighborhood alerts, direct messages, and status updates.',
      icon: Bell,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      status: permissions.notifications,
      actionText: permissions.notifications === 'granted' ? 'Send Test Alert' : 'Approve Access',
    },
    {
      id: 'camera',
      name: 'Camera Access',
      description: 'Capture live photos and video clips for your 24-hour cycle status.',
      icon: Camera,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      status: permissions.camera,
      actionText: permissions.camera === 'granted' ? 'Allowed' : 'Approve Access',
    },
    {
      id: 'microphone',
      name: 'Microphone Access',
      description: 'Record voice messages in direct chats and status audio recordings.',
      icon: Mic,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      status: permissions.microphone,
      actionText: permissions.microphone === 'granted' ? 'Allowed' : 'Approve Access',
    },
    {
      id: 'photos',
      name: 'Photos & Media Library',
      description: 'Upload existing media from your gallery to your feed and cycles.',
      icon: ImageIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      status: permissions.photos,
      actionText: permissions.photos === 'granted' ? 'Allowed' : 'Approve Access',
    },
  ];

  return (
    <div
      id="device-permissions-modal-backdrop"
      onClick={() => setIsPermissionsModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="device-permissions-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl h-[88vh] sm:h-auto max-h-[680px] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250"
      >
        {/* Mobile drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-white shrink-0">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Device Permissions</h3>
              <p className="text-[11px] text-neutral-400">Manage privacy approvals for Lalao</p>
            </div>
          </div>

          <button
            onClick={() => setIsPermissionsModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
          {permissionItems.map((item) => {
            const Icon = item.icon;
            const isGranted = item.status === 'granted';

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-neutral-900">{item.name}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-toggle for Precise Location if this is location */}
                {item.id === 'location' && isGranted && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-[11px] text-neutral-700 font-medium">Precise GPS</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePermission('preciseLocation', !permissions.preciseLocation)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        permissions.preciseLocation
                          ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {permissions.preciseLocation ? 'ON (Accurate)' : 'OFF (Neighborhood only)'}
                    </button>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-1 flex items-center justify-end gap-2">
                  {isGranted ? (
                    <>
                      <button
                        onClick={() => updatePermission(item.id as any, 'prompt')}
                        className="text-[10px] text-neutral-400 hover:text-neutral-600 font-medium px-2 py-1"
                      >
                        Reset
                      </button>
                      <button
                        disabled={isDetectingGps}
                        onClick={() => handleTestOrToggle(item.id as any)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center gap-1 transition-colors active:scale-95"
                      >
                        {testingItem === item.id || (item.id === 'location' && isDetectingGps) ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-[#5E43F3]" />
                        ) : null}
                        {item.actionText}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleTestOrToggle(item.id as any)}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                    >
                      Approve Access
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Privacy Security Card */}
          <div className="p-3.5 bg-neutral-100/70 rounded-2xl border border-neutral-200/50 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#5E43F3] shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-600 leading-relaxed">
              <strong className="text-neutral-800 font-semibold">Privacy Protected:</strong> Lalao does not sell or distribute personal GPS coordinates. Location is strictly utilized to filter the local radius feed and display neighbor proximity.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-white flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              // Quick approve all
              updatePermission('location', 'granted');
              updatePermission('notifications', 'granted');
              updatePermission('camera', 'granted');
              updatePermission('microphone', 'granted');
              updatePermission('photos', 'granted');
              triggerShareToast('All device permissions approved!');
            }}
            className="text-xs text-[#5E43F3] hover:underline font-semibold"
          >
            Allow All Permissions
          </button>

          <button
            onClick={() => setIsPermissionsModalOpen(false)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

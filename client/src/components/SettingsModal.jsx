import React, { useState } from 'react';
import { 
  X, Volume2, VolumeX, Bell, Radio, Check, 
  Sparkles, ShieldCheck, Laptop 
} from 'lucide-react';
import { 
  getStoredAudioSettings, 
  saveStoredAudioSettings, 
  playSynthesizedChime, 
  requestDesktopNotificationPermission,
  sendDesktopNotification
} from '../utils/audioAlerts';
import { USING_MOCK_API } from '../api';

export default function SettingsModal({ isOpen, onClose, onSaveToast }) {
  if (!isOpen) return null;

  const [settings, setSettings] = useState(getStoredAudioSettings());
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleSoundChange = (type) => {
    const updated = { ...settings, soundType: type };
    setSettings(updated);
    saveStoredAudioSettings(updated);
    playSynthesizedChime(type, settings.volume);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    const updated = { ...settings, volume: vol };
    setSettings(updated);
    saveStoredAudioSettings(updated);
  };

  const handleTestSound = () => {
    playSynthesizedChime(settings.soundType, settings.volume);
  };

  const handleRequestNotifications = async () => {
    const result = await requestDesktopNotificationPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      const updated = { ...settings, notificationsEnabled: true };
      setSettings(updated);
      saveStoredAudioSettings(updated);
      sendDesktopNotification('AlfaFocus Notifications Enabled', 'You will receive focus completion alerts even in other tabs!');
      if (onSaveToast) onSaveToast('Desktop notifications enabled!', 'success');
    } else {
      if (onSaveToast) onSaveToast('Notification permission denied by browser', 'error');
    }
  };

  const handleToggleNotifications = (e) => {
    const enabled = e.target.checked;
    if (enabled && notificationPermission !== 'granted') {
      handleRequestNotifications();
    } else {
      const updated = { ...settings, notificationsEnabled: enabled };
      setSettings(updated);
      saveStoredAudioSettings(updated);
      if (onSaveToast) onSaveToast(enabled ? 'Notifications enabled' : 'Notifications disabled', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#18181B] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-[#FAFAFA] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">App Settings &amp; Preferences</h2>
              <p className="text-xs text-zinc-400">Customize audio alerts, desktop notifications, and environment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Audio Synthesizer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Completion Alert Chime
            </label>
            <button 
              type="button"
              onClick={handleTestSound}
              className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition"
            >
              Test Chime
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bell', label: 'Harmonic Bell', desc: 'Warm 587Hz chime' },
              { id: 'gong', label: 'Deep Gong', desc: 'Resonant 220Hz tone' },
              { id: 'digital', label: 'Digital Beep', desc: 'Modern high-tech ping' },
              { id: 'mute', label: 'Mute', desc: 'Silent countdown' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSoundChange(option.id)}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  settings.soundType === option.id
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-white ring-1 ring-emerald-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{option.label}</p>
                  <p className="text-[10px] text-zinc-500">{option.desc}</p>
                </div>
                {settings.soundType === option.id && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-zinc-400 font-medium">
              <span>Chime Volume</span>
              <span className="font-mono text-emerald-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              disabled={settings.soundType === 'mute'}
              className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Section 2: Web Notifications */}
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                Browser Desktop Notifications
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Receive notifications when timer ends while viewing other browser tabs
              </p>
            </div>
            <input 
              type="checkbox"
              id="notifToggle"
              checked={settings.notificationsEnabled && notificationPermission === 'granted'}
              onChange={handleToggleNotifications}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {notificationPermission !== 'granted' && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Permission: <span className="font-mono text-amber-400">{notificationPermission}</span>
              </span>
              <button
                type="button"
                onClick={handleRequestNotifications}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Grant Permission
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Architecture & Connection Status */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-zinc-400" />
              API Deployment Mode
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              USING_MOCK_API 
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' 
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
            }`}>
              {USING_MOCK_API ? 'Local Client Demo' : 'Cloud Render API'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            {USING_MOCK_API 
              ? 'Local storage mode with immediate offline resilience' 
              : 'Connected to https://alfafocus-api.onrender.com (Supabase PostgreSQL)'}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-950"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

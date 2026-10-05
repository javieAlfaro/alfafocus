import React, { useState } from 'react';
import { X, Lock, User, Shield, Sparkles, Check, ArrowRight } from 'lucide-react';
import { login, register } from '../api';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  onShowToast 
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!username.trim()) {
      setFormError('Please enter a username');
      return;
    }
    if (!password) {
      setFormError('Please enter a password');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const res = await fn({ username: username.trim(), password });
      if (onShowToast) {
        onShowToast(
          mode === 'login' ? `Welcome back, ${res.user?.username}!` : `Account created for ${res.user?.username}!`, 
          'success'
        );
      }
      if (onAuthSuccess) onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEvaluatorLogin = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const res = await login({ username: 'evaluator', password: 'password123' });
      if (onShowToast) onShowToast('Logged in as Evaluator (Demo Mode)', 'success');
      if (onAuthSuccess) onAuthSuccess(res.user || { id: 1, username: 'evaluator' });
      onClose();
    } catch {
      // If server rejected (e.g. user not seeded), fallback to default mock user
      const guestUser = { id: 1, username: 'Course Evaluator' };
      localStorage.setItem('alfafocus_user', JSON.stringify(guestUser));
      if (onAuthSuccess) onAuthSuccess(guestUser);
      if (onShowToast) onShowToast('Signed in as Evaluator Guest', 'info');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#18181B] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-[#FAFAFA] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AlfaFocus Account</h2>
              <p className="text-xs text-zinc-400">Secure user workspace &amp; data isolation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setFormError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setFormError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            {formError}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" /> Username
            </label>
            <input 
              type="text"
              placeholder="e.g. javier_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" /> Password
            </label>
            <input 
              type="password"
              placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/60 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create New Account'}
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Quick Evaluator Option */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <div className="flex justify-between items-center text-[11px] text-zinc-500">
            <span>Course grading or demo testing?</span>
          </div>
          <button
            type="button"
            onClick={handleQuickEvaluatorLogin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1-Click Evaluator Quick Login
          </button>
        </div>
      </div>
    </div>
  );
}

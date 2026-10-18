import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  ChefHat, 
  GraduationCap,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';

/**
 * MessVerse Unified Login Portal
 * Single-credential login for Students & Mess Owners
 */
export default function LoginPage({ onLogin, theme = 'dark', onToggleTheme }) {
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'owner'
  const [credential, setCredential] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Accepted Single Credentials:
  // Student: 'student123' (or 'student')
  // Mess Owner: 'owner123' (or 'owner')
  const validCredentials = {
    student: ['student123', 'student'],
    owner: ['owner123', 'owner'],
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCredential('');
    setError('');
  };

  const handleQuickFill = (code) => {
    setCredential(code);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = credential.trim().toLowerCase();
    const allowed = validCredentials[selectedRole];

    if (!cleanInput) {
      setError('Please enter your access credential.');
      return;
    }

    if (allowed.includes(cleanInput)) {
      setIsSuccess(true);
      setTimeout(() => {
        onLogin({
          role: selectedRole === 'owner' ? 'staff' : 'student',
          credential: cleanInput,
        });
      }, 500);
    } else {
      setError(
        `Invalid credential for ${selectedRole === 'student' ? 'Student' : 'Mess Owner'}. Use: "${selectedRole === 'student' ? 'student123' : 'owner123'}"`
      );
    }
  };

  const isOwner = selectedRole === 'owner';

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar: Brand & Theme Switcher */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
              MessVerse
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:scale-105 cursor-pointer text-slate-700 dark:text-slate-200"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Deep Blue Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600" />
            )}
          </button>
        )}
      </div>

      {/* Main Login Card Centerpiece */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase mb-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Access Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
              Sign In to MessVerse
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select your role and enter your single access key
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
            {/* Student Role Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isOwner
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>

            {/* Mess Owner Role Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('owner')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isOwner
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Mess Owner</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label 
                htmlFor="credential-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                {isOwner ? '👨‍🍳 Mess Owner Key' : '🎓 Student Access Key'}
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="credential-input"
                  type="text"
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={
                    isOwner
                      ? 'Enter passcode (owner123)'
                      : 'Enter passcode (student123)'
                  }
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mt-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick 1-Click Autofill Demo Badge */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Single Credential:
                </span>
                <span className="text-xs font-mono font-black text-emerald-500">
                  {isOwner ? 'owner123' : 'student123'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill(isOwner ? 'owner123' : 'student123')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 cursor-pointer transition-colors"
              >
                ⚡ 1-Click Fill
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSuccess}
              className={`w-full py-3 px-4 rounded-xl font-bold font-display text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all cursor-pointer ${
                isOwner
                  ? 'bg-violet-600 hover:bg-violet-500 active:scale-[0.99] shadow-violet-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-emerald-600/30'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Access Granted! Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Enter {isOwner ? 'Chef HQ' : 'Student Zone'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials Guide Cheat-sheet Card */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              📋 Ready-to-Use Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div 
                onClick={() => { handleRoleSelect('student'); handleQuickFill('student123'); }}
                className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-left cursor-pointer hover:border-emerald-500/40 transition-colors"
              >
                <div className="font-bold text-slate-900 text-[11px]">🎓 Student</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">student123</div>
              </div>

              <div 
                onClick={() => { handleRoleSelect('owner'); handleQuickFill('owner123'); }}
                className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-left cursor-pointer hover:border-violet-500/40 transition-colors"
              >
                <div className="font-bold text-slate-900 text-[11px]">👨‍🍳 Mess Owner</div>
                <div className="font-mono font-bold text-violet-400 mt-0.5">owner123</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-slate-500">
        MessVerse Smart Meal Planning & Waste Analytics • Zero Waste Movement
      </div>
    </div>
  );
}

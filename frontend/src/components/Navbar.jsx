import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Sparkles } from 'lucide-react';

/**
 * Navbar Component for MessVerse
 * Premium Dark Glass header with fluid Framer Motion role switcher.
 */
export default function Navbar({
  role = 'student',
  onRoleChange,
  user = {
    name: 'Aarav Sharma',
    avatar: 'AS',
    streak_count: 12,
    xp_points: 450,
  },
}) {
  const [internalRole, setInternalRole] = useState(role);
  const currentRole = onRoleChange ? role : internalRole;

  const handleRoleToggle = (newRole) => {
    if (onRoleChange) {
      onRoleChange(newRole);
    } else {
      setInternalRole(newRole);
    }
  };

  const isStaff = currentRole === 'staff';

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none group"
          onClick={() => handleRoleToggle('student')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight font-display bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              MessVerse
            </span>
          </div>
          <span className="hidden md:inline-block text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 ml-1">
            SmartMess
          </span>
        </div>

        {/* Right Cluster: Interactive Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Framer-Motion Animated Role Switcher */}
          <nav
            className="relative flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 shadow-inner"
            aria-label="Role Switcher"
          >
            <button
              type="button"
              id="student-zone-toggle"
              onClick={() => handleRoleToggle('student')}
              className={`relative px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors z-10 cursor-pointer flex items-center gap-1.5 ${
                !isStaff ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg shadow-md shadow-emerald-500/30 -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>🎓</span>
              <span className="hidden sm:inline">Student Zone</span>
              <span className="sm:hidden">Student</span>
            </button>

            <button
              type="button"
              id="staff-analytics-toggle"
              onClick={() => handleRoleToggle('staff')}
              className={`relative px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors z-10 cursor-pointer flex items-center gap-1.5 ${
                isStaff ? 'text-white font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md shadow-violet-500/35 -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>👨‍🍳</span>
              <span className="hidden sm:inline">Staff Analytics</span>
              <span className="sm:hidden">Staff</span>
            </button>
          </nav>

          {/* User Profile Pill */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm transition-all cursor-default"
            id="user-profile-pill"
            title={`${user.name || 'Student'} • ${user.streak_count || 0} Day Streak • ${user.xp_points || 0} XP`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600/30 to-indigo-500/20 text-violet-300 font-black text-xs flex items-center justify-center border border-violet-500/40 shadow-sm flex-shrink-0 font-display">
              {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : '⚡')}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-400 font-display font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
                <span>{user.streak_count ?? 12}d</span>
              </span>

              <span className="hidden sm:inline-block w-px h-3.5 bg-slate-800" />

              <span className="hidden sm:flex items-center gap-1 text-violet-400 font-display font-bold">
                <Star className="w-3.5 h-3.5 text-violet-400 fill-violet-400/80" />
                <span>{user.xp_points ?? 450} XP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

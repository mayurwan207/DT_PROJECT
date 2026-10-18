import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Sparkles } from 'lucide-react';

/**
 * Navbar Component for MessVerse
 * Gen-Z Styled Clean Header with fluid role switcher.
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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => handleRoleToggle('student')}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight font-display bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              MessVerse
            </span>
          </div>
          <span className="hidden md:inline-block text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ml-1">
            Zero Waste ⚡ No Cap
          </span>
        </div>

        {/* Right Cluster: Interactive Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Framer-Motion Animated Role Switcher */}
          <nav
            className="relative flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-inner"
            aria-label="Role Switcher"
          >
            <button
              type="button"
              id="student-zone-toggle"
              onClick={() => handleRoleToggle('student')}
              className={`relative px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors z-10 cursor-pointer flex items-center gap-1.5 ${
                !isStaff ? 'text-white font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {!isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-emerald-600 rounded-lg shadow-sm -z-10"
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
                isStaff ? 'text-white font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-violet-600 rounded-lg shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>👨‍🍳</span>
              <span className="hidden sm:inline">Head Chef HQ</span>
              <span className="sm:hidden">Chefs</span>
            </button>
          </nav>

          {/* User Profile Pill */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm transition-all cursor-default"
            id="user-profile-pill"
            title={`${user.name || 'Student'} • ${user.streak_count || 0} Day Streak • ${user.xp_points || 0} Aura XP`}
          >
            <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center border border-violet-200 shadow-sm flex-shrink-0 font-display">
              {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : '⚡')}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-600 font-display font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{user.streak_count ?? 12}d</span>
              </span>

              <span className="hidden sm:inline-block w-px h-3.5 bg-slate-200" />

              <span className="hidden sm:flex items-center gap-1 text-violet-600 font-display font-bold">
                <Star className="w-3.5 h-3.5 text-violet-500 fill-violet-500" />
                <span>{user.xp_points ?? 450} XP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

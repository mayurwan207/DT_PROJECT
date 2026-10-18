import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import './Navbar.css';

/**
 * Navbar Component for MessVerse
 * Razor-sharp Neo-Brutalist glass header optimized for laptop & mobile screens.
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
    <header className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-xl border-b-2 border-emerald-500/80 shadow-[0_4px_24px_rgba(16,185,129,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none group"
          onClick={() => handleRoleToggle('student')}
        >
          <span className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
            MessVerse
          </span>
          <span className="text-xl animate-pulse filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
            ⚡
          </span>
        </div>

        {/* Right Cluster: Interactive Role Switcher & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Framer-Motion Animated Role Switcher */}
          <nav
            className="relative flex items-center bg-slate-900/90 border-2 border-slate-700/80 rounded-full p-1 shadow-inner"
            aria-label="Role Switcher"
          >
            <button
              type="button"
              id="student-zone-toggle"
              onClick={() => handleRoleToggle('student')}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-black transition-colors z-10 cursor-pointer flex items-center gap-1.5 ${
                !isStaff ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {!isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_14px_rgba(16,185,129,0.6),2px_2px_0px_#065F46] -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
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
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-black transition-colors z-10 cursor-pointer flex items-center gap-1.5 ${
                isStaff ? 'text-white font-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {isStaff && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_14px_rgba(168,85,247,0.6),2px_2px_0px_#4C1D95] -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <span>👨‍🍳</span>
              <span className="hidden sm:inline">Staff Analytics</span>
              <span className="sm:hidden">Staff</span>
            </button>
          </nav>

          {/* User Profile Pill */}
          <div
            className="flex items-center gap-2.5 bg-slate-900/90 border-2 border-purple-500/50 hover:border-purple-400 rounded-full px-3 py-1.5 shadow-[0_0_16px_rgba(139,92,246,0.15)] transition-all cursor-default"
            id="user-profile-pill"
            title={`${user.name || 'Student'} • ${user.streak_count || 0} Day Streak • ${user.xp_points || 0} XP`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center border border-purple-400 shadow-sm flex-shrink-0">
              {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : '⚡')}
            </div>

            <div className="hidden sm:flex items-center gap-2.5 text-xs font-bold">
              <span className="flex items-center gap-1 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{user.streak_count ?? 12}d</span>
              </span>

              <span className="w-px h-3.5 bg-slate-700" />

              <span className="flex items-center gap-1 text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">
                <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                <span>{user.xp_points ?? 450} XP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

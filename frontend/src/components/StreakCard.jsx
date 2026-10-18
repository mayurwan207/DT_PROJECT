import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import './StreakCard.css';

/**
 * Badge Tier milestones for clean plate streak.
 */
const BADGE_TIERS = [
  { minDays: 0,  target: 7,  name: 'Plate Hero',         icon: '🥉' },
  { minDays: 7,  target: 15, name: 'Eco Legend',         icon: '🏆' },
  { minDays: 15, target: 30, name: 'Zero-Waste Warrior', icon: '⚔️' },
  { minDays: 30, target: 50, name: 'Mess Titan',         icon: '👑' },
];

/**
 * Calculates current tier, next tier target, and progress percentage.
 */
function getTierProgress(streak) {
  const currentTier =
    [...BADGE_TIERS].reverse().find((t) => streak >= t.minDays) || BADGE_TIERS[0];

  const targetDays = currentTier.target;
  const daysLeft = Math.max(0, targetDays - streak);
  const startDays = currentTier.minDays;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((streak - startDays) / (targetDays - startDays)) * 100))
  );

  return {
    currentTier,
    targetDays,
    daysLeft,
    progressPercent,
    badgeTitle: `${currentTier.name} ${currentTier.icon}`,
  };
}

/**
 * StreakCard Component
 * Crisp White / Light Mode Theme
 */
export default function StreakCard({
  initialStreak = 12,
  initialXp = 450,
  onCheckIn,
  studentName = 'Student',
}) {
  const [streak, setStreak] = useState(initialStreak);
  const [xp, setXp] = useState(initialXp);
  const [hasClearedToday, setHasClearedToday] = useState(false);
  const [floatingXpList, setFloatingXpList] = useState([]);

  const { targetDays, daysLeft, progressPercent, currentTier } = getTierProgress(streak);

  // Trigger confetti burst + floating +50 XP animation
  const handlePlateCleared = (e) => {
    if (hasClearedToday) return;

    // 1. Confetti cannon blast
    try {
      const rect = e?.currentTarget?.getBoundingClientRect?.();
      const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
      const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.7;

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899'],
        ticks: 200,
        gravity: 1.1,
        scalar: 1.1,
      });

      // Secondary star blast
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { x: originX, y: originY },
          shapes: ['star', 'circle'],
          colors: ['#F59E0B', '#10B981', '#FFFFFF'],
          scalar: 1.25,
        });
      }, 150);
    } catch {
      // Fallback
    }

    // 2. Increment streak & XP
    const newStreak = streak + 1;
    const newXp = xp + 50;
    setStreak(newStreak);
    setXp(newXp);
    setHasClearedToday(true);

    // 3. Spawn floating +50 XP badge
    const badgeId = Date.now();
    setFloatingXpList((prev) => [...prev, { id: badgeId }]);

    setTimeout(() => {
      setFloatingXpList((prev) => prev.filter((item) => item.id !== badgeId));
    }, 1800);

    // 4. Trigger optional parent callback
    if (onCheckIn) {
      onCheckIn({ streak: newStreak, xp: newXp });
    }
  };

  const handleResetDemo = () => {
    setHasClearedToday(false);
    setStreak(initialStreak);
    setXp(initialXp);
  };

  return (
    <motion.div
      className="relative glass-panel p-6 flex flex-col justify-between gap-6 h-full shadow-sm overflow-visible select-none"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Header: Tag + XP Counter */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Zero Waste Streak</span>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1 text-xs font-bold text-violet-700 font-display">
          <Star className="w-3.5 h-3.5 text-violet-600 fill-violet-500" />
          <span>{xp} XP</span>
        </div>
      </div>

      {/* Main Section: Animated Fire + Streak Counter */}
      <div className="relative z-10 flex items-center gap-4 py-1">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex-shrink-0">
          <motion.span
            className="text-4xl select-none filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            animate={{
              scale: [1, 1.12, 0.98, 1.1, 1],
              rotate: [-3, 4, -4, 4, -3],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
          >
            🔥
          </motion.span>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <motion.span
              key={streak}
              className="font-display text-4xl sm:text-5xl font-black text-amber-600 tracking-tight"
              initial={{ scale: 1.3, color: '#059669' }}
              animate={{ scale: 1, color: '#D97706' }}
              transition={{ duration: 0.35, ease: 'backOut' }}
            >
              {streak}
            </motion.span>
            <span className="font-display text-base sm:text-lg font-bold text-slate-700 uppercase tracking-wider">
              Days
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {studentName ? `${studentName}'s Clean Plate Habit` : 'Active Clean Plate Habit'}
          </p>
        </div>
      </div>

      {/* Progress Bar: Next Badge Tier Tracker */}
      <div className="relative z-10 flex flex-col gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <span>{daysLeft > 0 ? `${daysLeft} days to unlock` : 'Unlocked:'}</span>
            <strong className="text-amber-700 font-bold">
              '{currentTier.name}' {currentTier.icon}
            </strong>
          </span>
          <span className="text-emerald-700 font-mono font-bold">{progressPercent}%</span>
        </div>

        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative shimmer-track">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span>Milestone: {currentTier.minDays}d</span>
          <span>Target: {targetDays}d</span>
        </div>
      </div>

      {/* Action Button & Floating XP Animation */}
      <div className="relative z-10 flex flex-col gap-2 mt-auto">
        {/* Floating +50 XP badging container */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <AnimatePresence>
            {floatingXpList.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -45, scale: 1.15 }}
                exit={{ opacity: 0, y: -70, scale: 0.85 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="whitespace-nowrap font-display text-sm font-black text-amber-700 bg-white border-2 border-amber-400 px-3 py-1 rounded-full shadow-md"
              >
                ✨ +50 XP
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          id="clean-plate-action-btn"
          onClick={handlePlateCleared}
          disabled={hasClearedToday}
          whileHover={!hasClearedToday ? { scale: 1.02 } : {}}
          whileTap={!hasClearedToday ? { scale: 0.97 } : {}}
          className={`w-full py-3.5 px-4 rounded-xl font-display font-extrabold text-sm sm:text-base tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
            hasClearedToday
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-sm cursor-default'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-500 shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 font-black'
          }`}
        >
          <span>{hasClearedToday ? '✅' : '🍽️'}</span>
          <span>
            {hasClearedToday
              ? 'Plate Cleared Today! (+50 XP Earned)'
              : 'Plate Cleared Today! 🍽️'}
          </span>
        </motion.button>

        {hasClearedToday && (
          <button
            type="button"
            onClick={handleResetDemo}
            className="text-center text-[11px] text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors cursor-pointer mt-1"
          >
            ↺ Reset for preview demo
          </button>
        )}
      </div>
    </motion.div>
  );
}

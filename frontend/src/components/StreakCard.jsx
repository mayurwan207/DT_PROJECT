import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * Displays active Zero Food Wastage Streak with fire animations,
 * "Plate Cleared Today! 🍽️" confetti button, floating +50 XP feedback,
 * and next badge tier progress tracker.
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
      // Graceful fallback if canvas-confetti environment lacks canvas
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

    // Auto-remove floating badge after animation finishes
    setTimeout(() => {
      setFloatingXpList((prev) => prev.filter((item) => item.id !== badgeId));
    }, 1800);

    // 4. Trigger optional parent callback
    if (onCheckIn) {
      onCheckIn({ streak: newStreak, xp: newXp });
    }
  };

  // Demo helper to allow multiple testing clicks
  const handleResetDemo = () => {
    setHasClearedToday(false);
    setStreak(initialStreak);
    setXp(initialXp);
  };

  return (
    <motion.div
      className="streak-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Ambient background glows */}
      <div className="streak-card__ambient-glow" aria-hidden="true" />
      <div className="streak-card__ambient-glow streak-card__ambient-glow--left" aria-hidden="true" />

      <div className="streak-card__content">
        {/* Header: Tag + XP Counter */}
        <div className="streak-card__header">
          <div className="streak-card__badge-tag">
            <span className="streak-card__badge-dot" aria-hidden="true" />
            <span>Zero Waste Streak</span>
          </div>

          <div className="streak-card__xp-counter">
            <span aria-hidden="true">⚡</span>
            <span>{xp} XP</span>
          </div>
        </div>

        {/* Main Section: Animated Fire + Streak Counter */}
        <div className="streak-card__main">
          <div className="streak-card__fire-wrapper">
            <motion.div
              className="streak-card__fire-halo"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            />
            <motion.span
              className="streak-card__fire-icon"
              role="img"
              aria-label="Fire streak"
              animate={{
                scale: [1, 1.15, 0.98, 1.12, 1],
                rotate: [-4, 6, -5, 5, -4],
                filter: [
                  'drop-shadow(0 0 10px rgba(245,158,11,0.85)) drop-shadow(0 0 20px rgba(239,68,68,0.5))',
                  'drop-shadow(0 0 18px rgba(245,158,11,1)) drop-shadow(0 0 32px rgba(239,68,68,0.85))',
                  'drop-shadow(0 0 12px rgba(245,158,11,0.9)) drop-shadow(0 0 22px rgba(239,68,68,0.6))',
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: 'easeInOut',
              }}
            >
              🔥
            </motion.span>
          </div>

          <div className="streak-card__details">
            <div className="streak-card__count-row">
              <motion.span
                key={streak}
                className="streak-card__count"
                initial={{ scale: 1.35, color: '#10B981' }}
                animate={{ scale: 1, color: '#F59E0B' }}
                transition={{ duration: 0.35, ease: 'backOut' }}
              >
                {streak}
              </motion.span>
              <span className="streak-card__unit">Days</span>
            </div>
            <p className="streak-card__title">
              {studentName ? `${studentName}'s Clean Plate Habit` : 'Active Clean Plate Habit'}
            </p>
          </div>
        </div>

        {/* Progress Bar: Next Badge Tier Tracker */}
        <div className="streak-card__progress-section">
          <div className="streak-card__tier-info">
            <span className="streak-card__tier-label">
              <span>{daysLeft > 0 ? `${daysLeft} days left to unlock` : 'Unlocked:'}</span>
              <strong style={{ color: '#F59E0B' }}>
                '{currentTier.name}' {currentTier.icon}
              </strong>
            </span>
            <span className="streak-card__tier-percent">{progressPercent}%</span>
          </div>

          <div className="streak-card__bar-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="streak-card__bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            >
              <div className="streak-card__bar-shimmer" />
            </motion.div>
          </div>

          <div className="streak-card__tier-target">
            <span>Milestone: {currentTier.minDays}d</span>
            <span>Target: {targetDays}d</span>
          </div>
        </div>

        {/* Action Button & Floating XP Animation */}
        <div className="streak-card__actions">
          {/* Floating +50 XP badging */}
          <div className="streak-card__floating-container">
            <AnimatePresence>
              {floatingXpList.map((item) => (
                <motion.div
                  key={item.id}
                  className="streak-card__floating-xp"
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -65, scale: 1.15 }}
                  exit={{ opacity: 0, y: -90, scale: 0.85 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                >
                  ✨ +50 XP
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            id="clean-plate-action-btn"
            className={`streak-card__btn ${hasClearedToday ? 'streak-card__btn--completed' : ''}`}
            onClick={handlePlateCleared}
            disabled={hasClearedToday}
            whileHover={!hasClearedToday ? { scale: 1.025, y: -2 } : {}}
            whileTap={!hasClearedToday ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 450, damping: 18 }}
          >
            <div className="streak-card__btn-glow" aria-hidden="true" />
            <span className="streak-card__btn-icon" aria-hidden="true">
              {hasClearedToday ? '✅' : '🍽️'}
            </span>
            <span>
              {hasClearedToday
                ? 'Plate Cleared Today! (+50 XP Earned)'
                : 'Plate Cleared Today! 🍽️'}
            </span>
          </motion.button>

          {hasClearedToday && (
            <button
              type="button"
              className="streak-card__demo-reset"
              onClick={handleResetDemo}
              title="Reset state to preview button animation again"
            >
              ↺ Reset for preview demo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

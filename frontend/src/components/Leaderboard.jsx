import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Star } from 'lucide-react';

/**
 * Fallback realistic leaderboard seed data in case backend database is empty
 */
const DEFAULT_ZERO_WASTE = [
  { rank: 1, student_id: 101, name: 'Ananya Deshmukh', streak_count: 29, review_count: 18, xp_points: 1450, tier: 'Mess Titan 👑' },
  { rank: 2, student_id: 102, name: 'Rohan Verma',     streak_count: 24, review_count: 15, xp_points: 1200, tier: 'Zero-Waste Warrior ⚔️' },
  { rank: 3, student_id: 1,   name: 'Aarav Sharma',    streak_count: 18, review_count: 12, xp_points: 900,  tier: 'Eco Legend 🏆' },
  { rank: 4, student_id: 104, name: 'Sneha Patel',     streak_count: 14, review_count: 9,  xp_points: 700,  tier: 'Plate Hero 🥉' },
  { rank: 5, student_id: 105, name: 'Kabir Mehta',     streak_count: 12, review_count: 11, xp_points: 600,  tier: 'Plate Hero 🥉' },
  { rank: 6, student_id: 106, name: 'Pooja Nair',      streak_count: 10, review_count: 8,  xp_points: 500,  tier: 'Green Scout 🌱' },
  { rank: 7, student_id: 107, name: 'Vikram Joshi',    streak_count: 8,  review_count: 6,  xp_points: 400,  tier: 'Green Scout 🌱' },
  { rank: 8, student_id: 108, name: 'Diya Sen',        streak_count: 7,  review_count: 14, xp_points: 350,  tier: 'Green Scout 🌱' },
  { rank: 9, student_id: 109, name: 'Arjun Reddy',     streak_count: 5,  review_count: 4,  xp_points: 250,  tier: 'Eco Rookie 🌾' },
  { rank: 10, student_id: 110, name: 'Meera Iyer',     streak_count: 4,  review_count: 7,  xp_points: 200,  tier: 'Eco Rookie 🌾' },
];

const DEFAULT_REVIEW_SUPERSTARS = [
  { rank: 1, student_id: 201, name: 'Kabir Mehta',     review_count: 38, streak_count: 12, xp_points: 1350, tier: 'Master Critic 🎖️' },
  { rank: 2, student_id: 202, name: 'Diya Sen',        review_count: 32, streak_count: 7,  xp_points: 1150, tier: 'Taste Connoisseur 🍷' },
  { rank: 3, student_id: 203, name: 'Ananya Deshmukh', review_count: 28, streak_count: 29, xp_points: 1450, tier: 'Foodie Elite 🍽️' },
  { rank: 4, student_id: 1,   name: 'Aarav Sharma',    review_count: 22, streak_count: 18, xp_points: 900,  tier: 'Savvy Reviewer 📝' },
  { rank: 5, student_id: 205, name: 'Rohan Verma',     review_count: 19, streak_count: 24, xp_points: 1200, tier: 'Savvy Reviewer 📝' },
  { rank: 6, student_id: 206, name: 'Sneha Patel',     review_count: 16, streak_count: 14, xp_points: 700,  tier: 'Daily Taster 😋' },
  { rank: 7, student_id: 207, name: 'Pooja Nair',      review_count: 14, streak_count: 10, xp_points: 500,  tier: 'Daily Taster 😋' },
  { rank: 8, student_id: 208, name: 'Meera Iyer',      review_count: 11, streak_count: 4,  xp_points: 200,  tier: 'Food Scout 🔍' },
  { rank: 9, student_id: 209, name: 'Vikram Joshi',    review_count: 9,  streak_count: 8,  xp_points: 400,  tier: 'Food Scout 🔍' },
  { rank: 10, student_id: 210, name: 'Arjun Reddy',    review_count: 7,  streak_count: 5,  xp_points: 250,  tier: 'Apprentice Critic 🥄' },
];

function getTierName(streak, xp) {
  if (streak >= 25 || xp >= 1400) return 'Mess Titan 👑';
  if (streak >= 15 || xp >= 1000) return 'Zero-Waste Warrior ⚔️';
  if (streak >= 8 || xp >= 600)   return 'Eco Legend 🏆';
  if (streak >= 4 || xp >= 300)   return 'Plate Hero 🥉';
  return 'Green Scout 🌱';
}

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Leaderboard Component
 * Features:
 * 1. Dual tab switcher: 🔥 Zero-Waste Champions vs ⭐ Review Superstars
 * 2. Harmonic Top 3 Podium Cards with Gold, Silver, and Bronze elevation.
 * 3. Pixel-perfect 4th–10th ranked grid with "You" highlight.
 */
export default function Leaderboard({ currentStudentId = 1 }) {
  const [activeTab, setActiveTab] = useState('streak'); // 'streak' | 'review'
  const [leaderboardData, setLeaderboardData] = useState({
    zero_waste_champions: DEFAULT_ZERO_WASTE,
    review_superstars: DEFAULT_REVIEW_SUPERSTARS,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (
            isMounted &&
            data.zero_waste_champions?.length > 0 &&
            data.review_superstars?.length > 0
          ) {
            setLeaderboardData(data);
          }
        }
      } catch {
        // Fallback to rich pre-seeded mock list
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentList =
    activeTab === 'streak'
      ? leaderboardData.zero_waste_champions || DEFAULT_ZERO_WASTE
      : leaderboardData.review_superstars || DEFAULT_REVIEW_SUPERSTARS;

  // Podium positions: [Silver (2nd), Gold (1st), Bronze (3rd)]
  const top1 = currentList[0] || DEFAULT_ZERO_WASTE[0];
  const top2 = currentList[1] || DEFAULT_ZERO_WASTE[1];
  const top3 = currentList[2] || DEFAULT_ZERO_WASTE[2];

  const runnersUp = currentList.slice(3, 10);

  return (
    <section className="w-full flex flex-col gap-6" aria-label="Campus Leaderboards">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Trophy className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              Hall of Fame Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Celebrating hostel diners leading the fight against food wastage and sharing flavor insights.
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950/70 border border-slate-800 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('streak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'streak'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Zero-Waste Champions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Review Superstars</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-500 font-bold text-sm">
          Loading leaderboard rankings...
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
            {/* Rank 2: Silver 🥈 */}
            {top2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="order-2 md:order-1 relative glass-panel p-5 flex flex-col items-center text-center gap-3.5 border-slate-700/80 hover:border-slate-500/80 transition-all shadow-lg"
              >
                <div className="absolute -top-3.5 bg-slate-300 text-slate-950 font-black px-3.5 py-0.5 rounded-full text-xs uppercase tracking-wider shadow-md">
                  2nd Place 🥈
                </div>

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-white shadow-md mt-2">
                  {getInitials(top2.name)}
                </div>

                <div>
                  <h4 className="font-bold text-white text-base font-display">
                    {top2.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {top2.tier || getTierName(top2.streak_count, top2.xp_points)}
                  </span>
                </div>

                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">
                      {activeTab === 'streak' ? 'Streak' : 'Reviews'}
                    </span>
                    <strong className="text-amber-400 font-bold font-display">
                      {activeTab === 'streak' ? `🔥 ${top2.streak_count}d` : `⭐ ${top2.review_count}`}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">XP</span>
                    <strong className="text-violet-400 font-bold font-display">{top2.xp_points} XP</strong>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 1: Gold 🥇 (Elevated & Radiant) */}
            {top1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="order-1 md:order-2 relative glass-panel p-6 flex flex-col items-center text-center gap-4 border-amber-400/80 shadow-xl shadow-amber-500/15 md:-translate-y-3 z-10"
              >
                <div className="absolute -top-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-md shadow-amber-500/40 flex items-center gap-1">
                  <span>👑</span>
                  <span>Champion 1st</span>
                </div>

                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center border-4 border-amber-300 shadow-lg shadow-amber-500/40 mt-2">
                  {getInitials(top1.name)}
                </div>

                <div>
                  <h4 className="font-extrabold text-amber-200 text-lg font-display">
                    {top1.name}
                  </h4>
                  <span className="text-xs font-semibold text-amber-400">
                    {top1.tier || getTierName(top1.streak_count, top1.xp_points)}
                  </span>
                </div>

                <div className="w-full bg-slate-950/80 border border-amber-400/40 rounded-xl p-3 flex items-center justify-around text-xs shadow-inner">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono uppercase">
                      {activeTab === 'streak' ? 'Streak' : 'Reviews'}
                    </span>
                    <strong className="text-amber-300 text-sm font-black font-display">
                      {activeTab === 'streak' ? `🔥 ${top1.streak_count} Days` : `⭐ ${top1.review_count} Reviews`}
                    </strong>
                  </div>
                  <div className="h-7 w-px bg-amber-400/30" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono uppercase">Total XP</span>
                    <strong className="text-violet-300 text-sm font-black font-display">{top1.xp_points} XP</strong>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 3: Bronze 🥉 */}
            {top3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="order-3 relative glass-panel p-5 flex flex-col items-center text-center gap-3.5 border-amber-700/60 hover:border-amber-600/70 transition-all shadow-lg"
              >
                <div className="absolute -top-3.5 bg-amber-700 text-white font-black px-3.5 py-0.5 rounded-full text-xs uppercase tracking-wider shadow-md">
                  3rd Place 🥉
                </div>

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xl flex items-center justify-center border-2 border-amber-400/60 shadow-md mt-2">
                  {getInitials(top3.name)}
                </div>

                <div>
                  <h4 className="font-bold text-white text-base font-display">
                    {top3.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-500">
                    {top3.tier || getTierName(top3.streak_count, top3.xp_points)}
                  </span>
                </div>

                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">
                      {activeTab === 'streak' ? 'Streak' : 'Reviews'}
                    </span>
                    <strong className="text-amber-400 font-bold font-display">
                      {activeTab === 'streak' ? `🔥 ${top3.streak_count}d` : `⭐ ${top3.review_count}`}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">XP</span>
                    <strong className="text-violet-400 font-bold font-display">{top3.xp_points} XP</strong>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Ranked Table: 4th to 10th Place */}
          <div className="glass-panel p-4 sm:p-5 shadow-xl flex flex-col gap-3">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-mono font-bold text-slate-400 px-3 pb-2 border-b border-slate-800/80">
              <span className="col-span-2 sm:col-span-1 text-center">Rank</span>
              <span className="col-span-6 sm:col-span-5">Student</span>
              <span className="hidden sm:block sm:col-span-3 text-center">Badge Tier</span>
              <span className="col-span-2 text-center">
                {activeTab === 'streak' ? 'Streak' : 'Reviews'}
              </span>
              <span className="col-span-2 sm:col-span-1 text-right">XP</span>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {runnersUp.map((student) => {
                  const isCurrent = student.student_id === currentStudentId;

                  return (
                    <motion.div
                      key={student.student_id || student.rank}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
                      className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Rank Number Pill */}
                      <div className="col-span-2 sm:col-span-1 flex justify-center">
                        <span className="font-mono font-bold text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                          #{student.rank}
                        </span>
                      </div>

                      {/* Avatar & Name */}
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-sm text-slate-200 block truncate">
                            {student.name}
                            {isCurrent && (
                              <span className="ml-2 text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 sm:hidden block">
                            {student.tier || getTierName(student.streak_count, student.xp_points)}
                          </span>
                        </div>
                      </div>

                      {/* Badge Tier (Desktop) */}
                      <div className="hidden sm:block sm:col-span-3 text-center text-xs font-medium text-slate-400 truncate">
                        {student.tier || getTierName(student.streak_count, student.xp_points)}
                      </div>

                      {/* Metric (Streak or Reviews) */}
                      <div className="col-span-2 text-center font-bold text-xs">
                        {activeTab === 'streak' ? (
                          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block font-display">
                            🔥 {student.streak_count}d
                          </span>
                        ) : (
                          <span className="text-violet-400 bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 rounded-full inline-block font-display">
                            ⭐ {student.review_count}
                          </span>
                        )}
                      </div>

                      {/* XP Points */}
                      <div className="col-span-2 sm:col-span-1 text-right font-mono font-bold text-xs text-slate-300">
                        {student.xp_points} XP
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

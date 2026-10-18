import React, { useState } from 'react';
import {
  Flame,
  Star,
  MessageSquare,
  Utensils,
  Trophy,
  Sparkles,
} from 'lucide-react';
import Navbar from './components/Navbar';
import StreakCard from './components/StreakCard';
import MealRsvp from './components/MealRsvp';
import FeedbackForm from './components/FeedbackForm';
import Leaderboard from './components/Leaderboard';
import StaffDashboard from './components/StaffDashboard';

const TODAY_DATE = '2026-10-15';

// Mock weekly habit tracker days
const WEEK_DAYS = [
  { day: 'Mon', checked: true },
  { day: 'Tue', checked: true },
  { day: 'Wed', checked: true },
  { day: 'Thu', checked: true },
  { day: 'Fri', checked: true },
  { day: 'Sat', isToday: true },
  { day: 'Sun', isUpcoming: true },
];

/**
 * MessVerse Main Application Shell
 * Optimized for Laptop screens (1366px - 1920px), Tablets, and Mobile.
 */
function App() {
  const [role, setRole] = useState('student'); // 'student' | 'staff'
  const [rsvpSyncVersion, setRsvpSyncVersion] = useState(0);

  const [user, setUser] = useState({
    id: 1,
    name: 'Aarav Sharma',
    avatar: 'AS',
    streak_count: 12,
    xp_points: 450,
    review_count: 5,
  });

  // Handle Clean Plate check-in from StreakCard
  const handleCheckIn = ({ streak, xp }) => {
    setUser((prev) => ({
      ...prev,
      streak_count: streak,
      xp_points: xp,
    }));
  };

  // Handle RSVP update from MealRsvp -> triggers real-time StaffDashboard sync
  const handleRsvpUpdated = () => {
    setRsvpSyncVersion((prev) => prev + 1);
  };

  // Handle Feedback submission from FeedbackForm
  const handleFeedbackSuccess = () => {
    setUser((prev) => ({
      ...prev,
      review_count: prev.review_count + 1,
      xp_points: prev.xp_points + 25,
    }));
    setRsvpSyncVersion((prev) => prev + 1);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <Navbar
        role={role}
        onRoleChange={setRole}
        user={user}
      />

      {/* ── Main Viewport Container ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* App Header & Mode Status Bar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-800/80 pb-5">
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 self-start font-bold text-xs tracking-widest uppercase">
              <span
                className={`w-2 h-2 rounded-full ${
                  role === 'student'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                    : 'bg-purple-400 shadow-[0_0_8px_#A855F7]'
                }`}
              />
              <span className={role === 'student' ? 'text-emerald-400 font-extrabold' : 'text-purple-400 font-extrabold'}>
                {role === 'student' ? 'Active: Student Zone 🎓' : 'Active: Staff Analytics Hub 👨‍🍳'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-display tracking-tight">
              {role === 'student' ? `Welcome back, ${user.name} ⚡` : 'Canteen Staff Analytics Hub 🍳'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {role === 'student'
                ? 'Lock in your meal RSVP early to stop kitchen overcooking, verify your clean plate to build your streak, and climb the campus leaderboard!'
                : 'Monitor student attendance forecasts, dynamic batch advisories, and quality feedback updated in real time.'}
            </p>
          </div>

          {/* Quick Context Stats Pill & Navigation Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {role === 'student' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('meal-rsvp-section')}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>RSVPs</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('leaderboard-section')}
                  className="px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Ranks</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-900/90 border-2 border-slate-800 rounded-xl px-3.5 py-1.5 shadow-inner">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">RSVP Syncs</span>
                <strong className="text-emerald-400 text-xs font-black font-display">{rsvpSyncVersion}</strong>
              </div>
              <div className="h-5 w-px bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Date</span>
                <strong className="text-slate-200 text-xs font-mono">{TODAY_DATE}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ── Conditional Views ─────────────────────────────────────────── */}
        {role === 'student' ? (
          /* ==============================================================
             STUDENT VIEW:
             1. StreakCard + Clean Plate Mission Hub
             2. MealRsvp (Breakfast, Lunch, Dinner with Live Pulse)
             3. FeedbackForm (1-5 Star Mood rating + Tag Cloud)
             4. Leaderboard (Zero-Waste Champions vs Review Superstars)
             ============================================================== */
          <div className="flex flex-col gap-10">
            {/* Row 1: Zero-Waste Streak Card & Clean Plate Mission Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column (StreakCard): 5 Cols on laptop */}
              <div className="lg:col-span-5 flex flex-col">
                <StreakCard
                  initialStreak={user.streak_count}
                  initialXp={user.xp_points}
                  onCheckIn={handleCheckIn}
                  studentName={user.name}
                />
              </div>

              {/* Right Column (Campus Clean-Plate Command Hub): 7 Cols on laptop */}
              <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-xl border-2 border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-5">
                {/* Header with Algorithmic Formula */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Algorithmic Demand Engine</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Hostel Mess 1</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-100 font-display">
                    How Your RSVP Prevents 120+ kg of Daily Food Waste 🥦
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Hostel chefs cook with predictive batch precision using the formula:{' '}
                    <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-bold inline-block mt-0.5">
                      Expected Diners = Attending + (Unsure × 0.5)
                    </code>
                    . Submitting your choice stops overproduction before raw materials are prepped.
                  </p>
                </div>

                {/* Weekly Clean-Plate Habit Calendar */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Weekly Clean-Plate Habit</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">5/7 Days Verified (Level 2)</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {WEEK_DAYS.map((wd, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                          wd.checked
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-bold'
                            : wd.isToday
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 font-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-mono uppercase">{wd.day}</span>
                        <span className="text-xs">
                          {wd.checked ? '✓' : wd.isToday ? '🔥' : '·'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 High-Impact KPI Badges (with Verified Icons) */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Streak Habit</span>
                    <strong className="text-amber-400 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>{user.streak_count} Days</span>
                    </strong>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Eco Level</span>
                    <strong className="text-purple-400 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Star className="w-4 h-4 text-purple-400 fill-purple-400" />
                      <span>{user.xp_points} XP</span>
                    </strong>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Feedback Logs</span>
                    <strong className="text-emerald-400 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>{user.review_count} Reviews</span>
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Daily Meal RSVPs (Breakfast, Lunch, Dinner with Live Pulse Bars) */}
            <MealRsvp
              studentId={user.id}
              date={TODAY_DATE}
              onRsvpUpdated={handleRsvpUpdated}
            />

            {/* Row 3: Post-Meal Feedback Form (Stars, Mood Emoji, Tag Cloud, Confetti) */}
            <div id="feedback-section">
              <FeedbackForm
                studentId={user.id}
                date={TODAY_DATE}
                onSubmitSuccess={handleFeedbackSuccess}
              />
            </div>

            {/* Row 4: Hall of Fame Leaderboards (Podiums & 4th-10th Rankings) */}
            <div id="leaderboard-section">
              <Leaderboard
                currentStudentId={user.id}
              />
            </div>
          </div>
        ) : (
          /* ==============================================================
             STAFF VIEW:
             StaffDashboard with dynamic metric cards, batch advisories,
             tag distributions, and research takeaways — refreshed in real time.
             ============================================================== */
          <StaffDashboard
            refreshTrigger={rsvpSyncVersion}
          />
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500 font-mono">
        <p>MessVerse ⚡ AI-Driven Canteen Demand & Gamified Waste Reduction Platform</p>
      </footer>
    </div>
  );
}

export default App;

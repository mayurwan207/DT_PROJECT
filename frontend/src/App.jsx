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
 * Deep Midnight Blue Dark Mode & Clean Light Theme Switcher
 */
function App() {
  const [role, setRole] = useState('student'); // 'student' | 'staff'
  const [theme, setTheme] = useState('dark'); // 'dark' (Deep Blue) | 'light' (Clean White)
  const [rsvpSyncVersion, setRsvpSyncVersion] = useState(0);

  const [user, setUser] = useState({
    id: 1,
    name: 'Aarav Sharma',
    avatar: 'AS',
    streak_count: 12,
    xp_points: 450,
    review_count: 5,
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-500 selection:text-white ${
        theme === 'dark' ? 'theme-blue-dark dark' : 'theme-light-container'
      }`}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <Navbar
        role={role}
        onRoleChange={setRole}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* ── Main Viewport Container ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* App Header & Mode Status Bar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 self-start font-bold text-xs tracking-wider uppercase">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  role === 'student'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                }`}
              />
              <span className={role === 'student' ? 'text-emerald-700 font-extrabold' : 'text-violet-700 font-extrabold'}>
                {role === 'student' ? 'Student Zone • Main Character Energy 🎓⚡' : 'Canteen Master Chefs • The Cookery Hub 👨‍🍳🔥'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              {role === 'student' ? `Welcome back, ${user.name} ⚡ (Aura +10,000)` : 'Canteen Kitchen Operations & Analytics Hub 🍳'}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {role === 'student'
                ? 'Lock in your meal RSVPs early so the chefs don’t overcook, flex that clean plate streak, and climb the campus Hall of Fame leaderboard! No cap 🥦'
                : 'Monitor live student headcounts, AI batch recommendations, and flavor insights updated in real time.'}
            </p>
          </div>

          {/* Quick Context Stats Pill & Navigation Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {role === 'student' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('meal-rsvp-section')}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>⚡ Lock In Meals</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('leaderboard-section')}
                  className="px-3.5 py-1.5 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>👑 Leaderboard Rizz</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-sm">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Kitchen Syncs</span>
                <strong className="text-emerald-600 text-xs font-bold font-display">{rsvpSyncVersion} Live</strong>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Date</span>
                <strong className="text-slate-800 text-xs font-mono">{TODAY_DATE}</strong>
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
              <div className="lg:col-span-5 flex flex-col h-full">
                <StreakCard
                  initialStreak={user.streak_count}
                  initialXp={user.xp_points}
                  onCheckIn={handleCheckIn}
                  studentName={user.name}
                />
              </div>

              {/* Right Column (Campus Clean-Plate Command Hub): 7 Cols on laptop */}
              <div className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between gap-5 h-full">
                {/* Header with Algorithmic Formula */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zero-Waste AI Engine • Certified W</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Hostel Mess 1</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    How Your RSVP Saves 120+ kg of Food Daily (Actual W) 🥦🔥
                  </h3>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Hostel chefs cook with predictive math using the formula:{' '}
                    <code className="text-emerald-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold inline-block mt-0.5">
                      Expected Diners = Pulling Up + (50/50 Unsure × 0.5)
                    </code>
                    . Dropping your RSVP stops overproduction before onions even get chopped. Real talk!
                  </p>
                </div>

                {/* Weekly Clean-Plate Habit Calendar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Weekly Clean-Plate Grind</span>
                    </span>
                    <span className="text-emerald-700 font-mono text-[11px]">5/7 Days Verified (Certified Eco Beast)</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {WEEK_DAYS.map((wd) => (
                      <div
                        key={wd.day}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                          wd.checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                            : wd.isToday
                            ? 'bg-amber-50 border-amber-400 text-amber-700 font-black shadow-sm'
                            : 'bg-white border-slate-200 text-slate-400'
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
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Streak Habit</span>
                    <strong className="text-amber-700 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>{user.streak_count} Days Undefeated</span>
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Eco Level</span>
                    <strong className="text-violet-700 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Star className="w-4 h-4 text-violet-600 fill-violet-500" />
                      <span>{user.xp_points} Aura XP</span>
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center sm:text-left">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Taste Critic</span>
                    <strong className="text-emerald-700 text-base sm:text-lg font-display flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
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
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-mono">
        <p>MessVerse ⚡ Built for Campus Diners Who Hate Food Waste • 100% Aura, 0% Scrapings</p>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import {
  Users,
  Utensils,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Calendar,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_DATE = '2026-10-15';
const COST_PER_KG = 85; // Average ₹ cost per kg of prepared hostel meals

/**
 * Fallback seed data in case backend is offline during preview
 */
const DEFAULT_ANALYTICS = {
  query_date: DEFAULT_DATE,
  max_capacity: 500,
  meals: [
    {
      meal_type: 'breakfast',
      attending: 320,
      skipping: 100,
      unsure: 40,
      total_rsvps: 460,
      expected_diners: 340.0,
      prep_qty_kg: 85.0,
      waste_reduction_pct: 32.0,
      demand_ratio: 0.68,
      badge: '✅ Moderate Demand — Cook Standard Batch',
    },
    {
      meal_type: 'lunch',
      attending: 420,
      skipping: 30,
      unsure: 30,
      total_rsvps: 480,
      expected_diners: 435.0,
      prep_qty_kg: 108.75,
      waste_reduction_pct: 13.0,
      demand_ratio: 0.87,
      badge: '🔥 High Demand — Cook Full Batch',
    },
    {
      meal_type: 'dinner',
      attending: 180,
      skipping: 260,
      unsure: 30,
      total_rsvps: 470,
      expected_diners: 195.0,
      prep_qty_kg: 48.75,
      waste_reduction_pct: 61.0,
      demand_ratio: 0.39,
      badge: '⚠️ Low Demand — Reduce Batch by 20%',
    },
  ],
};

const DEFAULT_FEEDBACK_SUMMARY = {
  window_days: 7,
  total_reviews: 142,
  average_rating: 4.2,
  rating_breakdown: { '1': 6, '2': 10, '3': 24, '4': 58, '5': 44 },
  top_tags: [
    { tag: 'tasty', count: 68 },
    { tag: 'perfect', count: 42 },
    { tag: 'too_spicy', count: 19 },
    { tag: 'portion_small', count: 15 },
    { tag: 'cold', count: 11 },
    { tag: 'tasteless', count: 7 },
  ],
};

const POSITIVE_TAGS = new Set(['tasty', 'perfect', 'good_portion', 'clean_plate', 'fresh', 'hygienic']);

/**
 * Survey Findings research takeaways
 */
const SURVEY_FINDINGS = [
  {
    stat: '83.3%',
    highlight: 'Taste & Seasoning Mismatch',
    desc: 'Students cite inconsistent spice levels and bland gravies as the primary cause for abandoning untouched food on trays.',
    impact: 'Action: Use real-time tag cloud to adjust salt & chili levels across lunch/dinner batches.',
    badge: 'Primary Waste Cause',
    badgeColor: 'border-rose-500 text-rose-400 bg-rose-500/10',
  },
  {
    stat: '71.2%',
    highlight: 'Ghost Diners & Unannounced Skips',
    desc: 'Hostel residents frequently skip dinner without informing chefs, leading mess staff to cook for standard max capacity blindly.',
    impact: 'Action: 4-hour RSVP locks reduce unannounced dinner mismatch by over 60%.',
    badge: 'Operational Leak',
    badgeColor: 'border-amber-500 text-amber-400 bg-amber-500/10',
  },
  {
    stat: '68.4%',
    highlight: 'Rigid Standard Portion Sizes',
    desc: 'Diners receive full standard scoops regardless of hunger level, generating massive plate scrapings during rice servings.',
    impact: 'Action: Introduce quick mini-portion options for lighter eaters.',
    badge: 'Portion Control',
    badgeColor: 'border-blue-500 text-blue-400 bg-blue-500/10',
  },
  {
    stat: '34.5%',
    highlight: 'Average Raw Material Savings',
    desc: 'Pilot messes implementing dynamic demand prep targets saved over 120 kg of raw grains, dairy, and produce per day.',
    impact: 'Action: Track daily ₹ savings on cooking oil and basmati rice inventories.',
    badge: 'Proven Impact',
    badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
  },
];

/**
 * StaffDashboard Component
 * Features:
 * 1. Metric Cards: Expected Diners, Food Prep Target (kg), and Estimated Waste Saved (kg & ₹ saved).
 * 2. Advisory Badge Display: Dynamic alerts like High Demand or Low Interest batch reductions.
 * 3. Feedback & Tag Cloud Distribution: Visual percentage bars showing positive vs negative tags.
 * 4. Survey Findings Summary: Research takeaway cards.
 */
export default function StaffDashboard({ refreshTrigger = 0 }) {
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
  const [selectedMealFilter, setSelectedMealFilter] = useState('all'); // 'all' | 'breakfast' | 'lunch' | 'dinner'
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [feedbackSummary, setFeedbackSummary] = useState(DEFAULT_FEEDBACK_SUMMARY);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      let analyticsRes = await fetch(`/api/v1/staff/analytics?date=${selectedDate}`);
      if (!analyticsRes.ok) {
        analyticsRes = await fetch(`http://localhost:8000/api/v1/staff/analytics?date=${selectedDate}`);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.meals?.length > 0) {
          setAnalytics(data);
        }
      }

      let feedbackRes = await fetch('/api/v1/staff/feedback-summary');
      if (!feedbackRes.ok) {
        feedbackRes = await fetch('http://localhost:8000/api/v1/staff/feedback-summary');
      }
      if (feedbackRes.ok) {
        const fbData = await feedbackRes.json();
        setFeedbackSummary(fbData);
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        let analyticsRes = await fetch(`/api/v1/staff/analytics?date=${selectedDate}`);
        if (!analyticsRes.ok) {
          analyticsRes = await fetch(`http://localhost:8000/api/v1/staff/analytics?date=${selectedDate}`);
        }
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          if (data.meals?.length > 0 && !ignore) {
            setAnalytics(data);
          }
        }

        let feedbackRes = await fetch('/api/v1/staff/feedback-summary');
        if (!feedbackRes.ok) {
          feedbackRes = await fetch('http://localhost:8000/api/v1/staff/feedback-summary');
        }
        if (feedbackRes.ok && !ignore) {
          const fbData = await feedbackRes.json();
          setFeedbackSummary(fbData);
        }
      } catch {
        // Fallback
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, [selectedDate, refreshTrigger]);

  // Aggregate stats based on meal filter
  const displayedMeals =
    selectedMealFilter === 'all'
      ? analytics.meals
      : analytics.meals.filter((m) => m.meal_type === selectedMealFilter);

  const totalCapacity = (analytics.max_capacity || 500) * displayedMeals.length;
  const totalExpectedDiners = displayedMeals.reduce((acc, m) => acc + m.expected_diners, 0);
  const totalPrepKg = displayedMeals.reduce((acc, m) => acc + m.prep_qty_kg, 0);
  
  // Total potential waste avoided vs full capacity cooking
  const fullCapacityKg = totalCapacity * 0.25;
  const foodSavedKg = Math.max(0, Math.round((fullCapacityKg - totalPrepKg) * 10) / 10);
  const rupeesSaved = Math.round(foodSavedKg * COST_PER_KG);

  // Tag distribution calculation
  const totalTagCount = (feedbackSummary.top_tags || []).reduce((acc, t) => acc + t.count, 0) || 1;
  const positiveTagCount = (feedbackSummary.top_tags || [])
    .filter((t) => POSITIVE_TAGS.has(t.tag))
    .reduce((acc, t) => acc + t.count, 0);
  const negativeTagCount = totalTagCount - positiveTagCount;

  const positivePercent = Math.round((positiveTagCount / totalTagCount) * 100);
  const negativePercent = 100 - positivePercent;

  return (
    <div className="w-full flex flex-col gap-8 pb-12" aria-label="Staff Analytics Dashboard">
      {/* ── Top Dashboard Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400">
              👨‍🍳
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-display tracking-tight">
                Kitchen Operations & Demand Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time headcounts, predictive batch recommendations, and student taste analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector, Live Sync Badge & Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{refreshTrigger > 0 ? `Synced (${refreshTrigger} RSVP Updates)` : 'Live Kitchen Sync'}</span>
          </span>

          <div className="flex items-center gap-2 bg-slate-950/80 border-2 border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-mono font-bold cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border-2 border-slate-800 bg-slate-900/80 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer active:translate-y-0.5 shadow-[2px_2px_0px_#1E293B]"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs: All Meals vs Individual Slots ─────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'breakfast', 'lunch', 'dinner'].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedMealFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
              selectedMealFilter === filter
                ? 'bg-purple-600 text-white border-purple-400 shadow-[3px_3px_0px_#4C1D95,0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200 shadow-[2px_2px_0px_#0F172A]'
            }`}
          >
            {filter === 'all' ? '🍽️ All Meals Combined' : `🍴 ${filter}`}
          </button>
        ))}
      </div>

      {/* ── Feature 1: Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Expected Diners */}
        <div className="relative bg-slate-900/85 backdrop-blur-xl border-2 border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-4 group transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Projected Headcount
              </span>
              <h3 className="text-3xl font-black text-slate-100 font-display mt-1 tracking-tight">
                {Math.round(totalExpectedDiners)}{' '}
                <span className="text-sm font-semibold text-slate-500">/ {totalCapacity}</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Formula Breakdown:</span>
            <span className="text-emerald-400 font-mono">Attending + (Unsure × 0.5)</span>
          </div>
        </div>

        {/* Card 2: Food Prep Target (kg) */}
        <div className="relative bg-slate-900/85 backdrop-blur-xl border-2 border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-4 group transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Recommended Batch Target
              </span>
              <h3 className="text-3xl font-black text-amber-400 font-display mt-1 tracking-tight">
                {totalPrepKg.toFixed(1)}{' '}
                <span className="text-sm font-semibold text-slate-500">kg food</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Utensils className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Rate Target:</span>
            <span className="text-amber-300 font-mono">0.25 kg food / diner</span>
          </div>
        </div>

        {/* Card 3: Estimated Waste Saved (kg & ₹) */}
        <div className="relative bg-slate-900/85 backdrop-blur-xl border-2 border-slate-800 hover:border-teal-500/60 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] sm:col-span-2 lg:col-span-1 flex flex-col justify-between gap-4 group transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Food & Financial Savings
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-emerald-400 font-display tracking-tight">
                  {foodSavedKg} kg
                </h3>
                <span className="text-sm font-black text-teal-300 flex items-center bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-md">
                  <IndianRupee className="w-3.5 h-3.5 inline" /> {rupeesSaved.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.2)]">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Avoided Excess:</span>
            <span className="text-teal-400 font-mono">vs Blind Max Capacity (500)</span>
          </div>
        </div>
      </div>

      {/* ── Feature 2: Advisory Badge Display & Slot Breakdown ───────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <h3 className="text-xl font-black text-slate-100 font-display">
              Kitchen Batch Advisories & Operational Alerts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {displayedMeals.length} Slot{displayedMeals.length > 1 ? 's' : ''} Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {displayedMeals.map((meal) => {
            const isHighDemand = meal.demand_ratio >= 0.8;
            const isLowDemand = meal.demand_ratio < 0.5;

            return (
              <div
                key={meal.meal_type}
                className="bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-2xl p-5 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-4"
              >
                {/* Header with Title and Operational Badge */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-400">
                      Meal Slot
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {meal.total_rsvps} Total Responses
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-100 font-display capitalize">
                    {meal.meal_type}
                  </h4>

                  {/* Operational Badge Alert */}
                  <div
                    className={`p-3 rounded-xl border-2 text-xs font-black flex items-center gap-2 shadow-sm ${
                      isHighDemand
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : isLowDemand
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isHighDemand ? (
                      <Flame className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : isLowDemand ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    <span>{meal.badge}</span>
                  </div>
                </div>

                {/* RSVP Breakdown Headcounts */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Attending</span>
                      <strong className="text-emerald-400 font-bold">{meal.attending}</strong>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Skipping</span>
                      <strong className="text-rose-400 font-bold">{meal.skipping}</strong>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Unsure</span>
                      <strong className="text-amber-400 font-bold">{meal.unsure}</strong>
                    </div>
                  </div>

                  {/* Headcount vs Prep Target Output */}
                  <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/90 flex items-center justify-between text-xs mt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Expected Diners</span>
                      <strong className="text-slate-200 font-black">{meal.expected_diners}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Recommended Batch</span>
                      <strong className="text-amber-400 font-black">{meal.prep_qty_kg} kg</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feature 3: Feedback & Tag Cloud Distribution ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Positive vs Negative Tag Ratio */}
        <div className="bg-slate-900/85 backdrop-blur-xl border-2 border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="text-xl font-black text-slate-100 font-display">
                  Student Sentiment & Tag Distribution
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Past {feedbackSummary.window_days || 7} Days
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Distribution of flavor and portion feedback tags reported by students.
            </p>
          </div>

          {/* Visual Percentage Sentiment Bar */}
          <div className="flex flex-col gap-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Positive Sentiment ({positivePercent}%)
              </span>
              <span className="text-rose-400 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Issues Reported ({negativePercent}%)
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${positivePercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
              <div
                style={{ width: `${negativePercent}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>{positiveTagCount} Praise Tags</span>
              <span>{negativeTagCount} Adjustment Tags</span>
            </div>
          </div>

          {/* Individual Tag Frequency Chips */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Top Ranked Feedback Tags
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(feedbackSummary.top_tags || []).map((t) => {
                const isPositive = POSITIVE_TAGS.has(t.tag);
                return (
                  <div
                    key={t.tag}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between ${
                      isPositive
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <span className="capitalize">{t.tag.replace('_', ' ')}</span>
                    <span className="font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-[10px]">
                      {t.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 7-Day Star Rating Breakdown Card */}
        <div className="bg-slate-900/85 backdrop-blur-xl border-2 border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <h3 className="text-xl font-black text-slate-100 font-display">
                  Quality Satisfaction Score
                </h3>
              </div>
              <div className="flex items-baseline gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-amber-400">
                <strong className="text-base font-black">
                  {feedbackSummary.average_rating ? feedbackSummary.average_rating.toFixed(1) : '4.2'}
                </strong>
                <span className="text-[11px]">/ 5.0</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Calculated across {feedbackSummary.total_reviews || 142} validated post-meal student reviews.
            </p>
          </div>

          {/* Star Distribution Rows */}
          <div className="flex flex-col gap-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = feedbackSummary.rating_breakdown?.[String(stars)] || 0;
              const total = feedbackSummary.total_reviews || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono font-bold text-amber-400 flex items-center gap-1">
                    {stars} ★
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-slate-400 text-[11px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              Ratings below 3.0 automatically trigger alert flags for the head cook to review seasoning.
            </span>
          </div>
        </div>
      </div>

      {/* ── Feature 4: Survey Findings Summary (Canteen Research) ────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-black text-slate-100 font-display">
            Canteen Food Waste Research Insights & Survey Findings
          </h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Key empirical observations driving MessVerse's algorithmic demand and feedback framework.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SURVEY_FINDINGS.map((finding, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between gap-3.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-3xl font-black text-slate-100 font-display tracking-tight">
                    {finding.stat}
                  </h4>
                  <span className="text-sm font-extrabold text-purple-300 block mt-0.5">
                    {finding.highlight}
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${finding.badgeColor}`}>
                  {finding.badge}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.desc}
              </p>

              <div className="pt-2.5 border-t border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border">
                <span className="text-purple-400 font-bold block mb-0.5">Kitchen Takeaway:</span>
                {finding.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

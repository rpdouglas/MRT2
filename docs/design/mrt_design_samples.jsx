import { useState, useEffect, useRef } from "react";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
// Each module has: gradient pair, glow colour, persona, vibe label, icon
const MODULES = {
  dashboard: {
    label: "Dashboard", persona: "David", vibe: "Hope & Clarity",
    icon: "🌅", personaIcon: "🌊",
    gradA: "#38BDF8", gradB: "#2563EB",
    glowA: "#38BDF888", border: "#38BDF844",
    bg: "linear-gradient(145deg, #0C1A3A 0%, #0A0F2A 100%)",
    pill: "linear-gradient(135deg, #38BDF8, #2563EB)",
    pillGhost: "rgba(56,189,248,0.1)",
    accent: "#38BDF8", accentDim: "rgba(56,189,248,0.35)",
    textHigh: "#F0F9FF", textMid: "rgba(186,230,253,0.75)", textLow: "rgba(186,230,253,0.35)",
  },
  tasks: {
    label: "Tasks", persona: "Ned", vibe: "Energy & Action",
    icon: "⚡", personaIcon: "⚡",
    gradA: "#22D3EE", gradB: "#0D9488",
    glowA: "#22D3EE88", border: "#22D3EE44",
    bg: "linear-gradient(145deg, #042A2A 0%, #021A1A 100%)",
    pill: "linear-gradient(135deg, #22D3EE, #0D9488)",
    pillGhost: "rgba(34,211,238,0.1)",
    accent: "#22D3EE", accentDim: "rgba(34,211,238,0.35)",
    textHigh: "#F0FDFA", textMid: "rgba(153,246,228,0.75)", textLow: "rgba(153,246,228,0.35)",
  },
  service: {
    label: "Service", persona: "Lisa", vibe: "Warmth & Connection",
    icon: "🤝", personaIcon: "🌿",
    gradA: "#FB7185", gradB: "#F59E0B",
    glowA: "#FB718588", border: "#FB718544",
    bg: "linear-gradient(145deg, #2A100A 0%, #1A0A04 100%)",
    pill: "linear-gradient(135deg, #FB7185, #F59E0B)",
    pillGhost: "rgba(251,113,133,0.1)",
    accent: "#FB7185", accentDim: "rgba(251,113,133,0.35)",
    textHigh: "#FFF1F2", textMid: "rgba(254,205,211,0.75)", textLow: "rgba(254,205,211,0.35)",
  },
  insights: {
    label: "Insights", persona: "Walt", vibe: "Mystical & AI",
    icon: "✦", personaIcon: "🌙",
    gradA: "#E879F9", gradB: "#EC4899",
    glowA: "#E879F988", border: "#E879F944",
    bg: "linear-gradient(145deg, #1A0528 0%, #0F0320 100%)",
    pill: "linear-gradient(135deg, #E879F9, #EC4899)",
    pillGhost: "rgba(232,121,249,0.1)",
    accent: "#E879F9", accentDim: "rgba(232,121,249,0.35)",
    textHigh: "#FDF4FF", textMid: "rgba(245,208,254,0.75)", textLow: "rgba(245,208,254,0.35)",
  },
  workbooks: {
    label: "Workbooks", persona: "Maya", vibe: "Systematic Mastery",
    icon: "🧠", personaIcon: "🧠",
    gradA: "#818CF8", gradB: "#6D28D9",
    glowA: "#818CF888", border: "#818CF844",
    bg: "linear-gradient(145deg, #0F0A28 0%, #080520 100%)",
    pill: "linear-gradient(135deg, #818CF8, #6D28D9)",
    pillGhost: "rgba(129,140,248,0.1)",
    accent: "#818CF8", accentDim: "rgba(129,140,248,0.35)",
    textHigh: "#EEF2FF", textMid: "rgba(199,210,254,0.75)", textLow: "rgba(199,210,254,0.35)",
  },
};

const MODULE_ORDER = ["dashboard", "tasks", "service", "insights", "workbooks"];

// ── SHARED GLASS SHELL ────────────────────────────────────────────────────────
function GlassCard({ m, children, style = {} }) {
  return (
    <div style={{
      borderRadius: 20, overflow: "hidden", position: "relative",
      background: `linear-gradient(145deg, ${m.gradA}55, ${m.gradB}33)`,
      padding: 1.5, ...style,
    }}>
      <div style={{
        borderRadius: 19,
        background: "rgba(8, 4, 20, 0.62)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        padding: "18px 16px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient glows */}
        <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${m.gradA}30 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${m.gradB}25 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── PILL SEGMENT BAR (the signature component) ────────────────────────────────
function PillBar({ m, value, max = 10, prev = 0, segments = 10, height = 12, animate = true }) {
  const [revealed, setRevealed] = useState(animate ? 0 : value);
  const [ran, setRan] = useState(!animate);
  const ref = useRef();

  useEffect(() => {
    if (ran) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran) {
        setRan(true);
        let s = 0;
        const iv = setInterval(() => {
          s++;
          setRevealed(s);
          if (s >= value) clearInterval(iv);
        }, 55);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, ran]);

  const filled = animate ? revealed : value;

  return (
    <div ref={ref} style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: segments }).map((_, si) => {
        const isFilled = si < filled;
        const isPrev = si < prev;
        return (
          <div key={si} style={{
            flex: 1, height,
            borderRadius: 999,
            background: isFilled
              ? m.pill
              : isPrev
                ? m.pillGhost
                : "rgba(255,255,255,0.04)",
            boxShadow: isFilled ? `0 0 10px ${m.glowA}` : "none",
            border: `1px solid ${isFilled ? m.border : "rgba(255,255,255,0.06)"}`,
            transition: isFilled ? "all 0.2s ease" : "none",
            transform: isFilled ? "scaleY(1)" : "scaleY(0.75)",
            transformOrigin: "center",
          }} />
        );
      })}
    </div>
  );
}

// ── MODULE SCREENS ────────────────────────────────────────────────────────────

// ── DASHBOARD (David) ─────────────────────────────────────────────────────────
function DashboardScreen() {
  const m = MODULES.dashboard;
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 1800); return () => clearInterval(t); }, []);
  const sober = [365, 366, 367][tick % 3]; // animate up

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Sobriety hero */}
      <GlassCard m={m}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: m.textLow, textTransform: "uppercase", marginBottom: 4 }}>CLEAN TIME</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: `0 0 30px ${m.gradA}88` }}>
            {sober}
          </div>
          <div style={{ fontSize: 14, color: m.textMid, marginBottom: 16 }}>days of freedom</div>
          {/* Milestone pill bar */}
          <div style={{ marginBottom: 6 }}>
            <PillBar m={m} value={7} max={10} segments={10} height={10} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: m.textLow }}>0</span>
            <span style={{ fontSize: 10, color: m.accent, fontWeight: 700 }}>Next milestone: 400 days</span>
            <span style={{ fontSize: 10, color: m.textLow }}>400</span>
          </div>
        </div>
      </GlassCard>

      {/* Dynamic Anchor */}
      <GlassCard m={m}>
        <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>🌅 Morning Anchor</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["📖", "Reading", "Done"], ["✦", "Reflect", "Tap to start"], ["🎯", "Task", "2 remaining"]].map(([ic, l, sub]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${m.border}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{ic}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.textHigh }}>{l}</div>
              <div style={{ fontSize: 9, color: m.textLow, marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Mood check */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: m.textMid }}>Today's mood</span>
          <span style={{ fontSize: 10, color: m.textLow }}>7/10</span>
        </div>
        <PillBar m={m} value={7} max={10} segments={10} height={10} prev={5} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 9, color: m.textLow }}>Low</span>
          <span style={{ fontSize: 9, color: m.textLow }}>High</span>
        </div>
      </GlassCard>

      {/* SOS always accessible */}
      <div style={{ borderRadius: 16, background: `linear-gradient(135deg, ${m.gradA}22, ${m.gradB}22)`, border: `1px solid ${m.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(12px)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${m.gradA}, ${m.gradB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 16px ${m.glowA}` }}>🆘</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: m.textHigh }}>Urge Surfer</div>
          <div style={{ fontSize: 11, color: m.textLow }}>Tap for immediate grounding</div>
        </div>
      </div>
    </div>
  );
}

// ── TASKS (Ned) ───────────────────────────────────────────────────────────────
function TasksScreen() {
  const m = MODULES.tasks;
  const [xp, setXp] = useState(2340);
  const tasks = [
    { label: "Morning meditation", done: true, xp: 25, priority: "High" },
    { label: "Call sponsor", done: true, xp: 50, priority: "High" },
    { label: "Evening gratitude list", done: false, xp: 25, priority: "Medium" },
    { label: "Read daily reflection", done: false, xp: 10, priority: "Low" },
  ];
  const done = tasks.filter(t => t.done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Rhythm + XP header */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase" }}>TODAY'S MISSIONS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: m.textHigh }}>{done}<span style={{ fontSize: 15, color: m.textLow, fontWeight: 400 }}>/{tasks.length}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.08em" }}>XP</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: m.accent }}>{xp.toLocaleString()}</div>
          </div>
        </div>
        {/* Rhythm score as pill bar */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: m.textMid, fontWeight: 600 }}>14-Day Rhythm</span>
            <span style={{ fontSize: 11, color: m.accent, fontWeight: 700 }}>78 / 100</span>
          </div>
          <PillBar m={m} value={8} max={10} segments={10} height={10} prev={6} />
        </div>
      </GlassCard>

      {/* Task list */}
      <GlassCard m={m}>
        <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>⚡ Today</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: t.done ? m.pill : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${t.done ? m.accent : "rgba(255,255,255,0.12)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: t.done ? `0 0 8px ${m.glowA}` : "none",
              }}>
                {t.done && <span style={{ fontSize: 11, color: "#fff" }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.done ? m.textLow : m.textHigh, textDecoration: t.done ? "line-through" : "none" }}>{t.label}</div>
                {/* Mini pill bar for priority */}
                <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                  {Array.from({ length: 3 }).map((_, si) => (
                    <div key={si} style={{ width: 18, height: 4, borderRadius: 999, background: si < { High: 3, Medium: 2, Low: 1 }[t.priority] ? m.pill : "rgba(255,255,255,0.06)", boxShadow: si < { High: 3, Medium: 2, Low: 1 }[t.priority] ? `0 0 4px ${m.glowA}` : "none" }} />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 10, color: m.accent, fontWeight: 700, background: m.pillGhost, borderRadius: 999, padding: "2px 6px" }}>+{t.xp}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Streak */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: m.textMid }}>🔥 Habit Streak</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: m.accent }}>47 days</span>
        </div>
        <PillBar m={m} value={7} max={10} segments={10} height={10} />
        <div style={{ fontSize: 10, color: m.textLow, marginTop: 6, textAlign: "right" }}>Next milestone at 60 days</div>
      </GlassCard>
    </div>
  );
}

// ── SERVICE (Lisa) ────────────────────────────────────────────────────────────
function ServiceScreen() {
  const m = MODULES.service;
  const friends = [
    { name: "Sarah M.", step: 4, days: 62, lastContact: 2, status: "stable" },
    { name: "Jennifer K.", step: 2, days: 18, lastContact: 8, status: "needs-attention" },
    { name: "Rachel T.", step: 7, days: 180, lastContact: 1, status: "stable" },
    { name: "Claire B.", step: 1, days: 5, lastContact: 3, status: "early" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Service overview */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase" }}>YOUR FRIENDS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: m.textHigh }}>4 <span style={{ fontSize: 14, color: m.textLow, fontWeight: 400 }}>active</span></div>
          </div>
          <div style={{ background: m.pill, borderRadius: 12, padding: "8px 14px", boxShadow: `0 0 14px ${m.glowA}` }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Capacity</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>4/5</div>
          </div>
        </div>
        {/* Capacity pill bar */}
        <PillBar m={m} value={4} max={5} segments={5} height={10} />
        <div style={{ fontSize: 10, color: m.textLow, marginTop: 5 }}>1 spot remaining · capacity set by you</div>
      </GlassCard>

      {/* Friend cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {friends.map((f, i) => {
          const urgent = f.lastContact > 7;
          return (
            <div key={i} style={{
              borderRadius: 16, overflow: "hidden",
              background: urgent ? `linear-gradient(135deg, ${m.gradA}22, ${m.gradB}18)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${urgent ? m.border : "rgba(255,255,255,0.07)"}`,
              padding: "12px 14px",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: urgent ? m.textHigh : "rgba(255,255,255,0.8)" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: m.textLow }}>Step {f.step} · {f.days}d sober</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {urgent
                    ? <span style={{ fontSize: 10, fontWeight: 700, color: m.gradA, background: `${m.gradA}22`, borderRadius: 999, padding: "2px 8px" }}>⚠ {f.lastContact}d ago</span>
                    : <span style={{ fontSize: 10, color: m.textLow }}>{f.lastContact}d ago</span>
                  }
                </div>
              </div>
              {/* Step progress as pill bar */}
              <PillBar m={m} value={f.step} max={12} segments={12} height={6} animate={false} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: m.textLow }}>Step 1</span>
                <span style={{ fontSize: 9, color: m.accent }}>Step {f.step}/12</span>
                <span style={{ fontSize: 9, color: m.textLow }}>Step 12</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── INSIGHTS (Walt) ───────────────────────────────────────────────────────────
function InsightsScreen() {
  const m = MODULES.insights;
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];
  const scores = [14, 18, 22, 25, 29];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ROSC matrix */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recovery Capital</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: m.textHigh }}>29<span style={{ fontSize: 14, color: m.textLow, fontWeight: 400 }}>/40</span></div>
          </div>
          <span style={{ fontSize: 11, color: "#34D399", fontWeight: 700, background: "rgba(52,211,153,0.12)", borderRadius: 999, padding: "4px 10px" }}>▲ +4 this month</span>
        </div>
        {[
          { label: "Health", icon: "🫀", v: 8, p: 6 },
          { label: "Home", icon: "🏠", v: 7, p: 5 },
          { label: "Purpose", icon: "⭐", v: 7, p: 6 },
          { label: "Community", icon: "🤝", v: 7, p: 5 },
        ].map((d, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? 12 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: m.textMid }}>{d.icon} {d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: m.textHigh }}>{d.v}<span style={{ color: m.textLow, fontWeight: 400 }}>/10</span></span>
            </div>
            <PillBar m={m} value={d.v} max={10} segments={10} height={9} prev={d.p} />
          </div>
        ))}
      </GlassCard>

      {/* 5-month trajectory */}
      <GlassCard m={m}>
        <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>✦ 5-Month Trajectory</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {months.map((mo, i) => (
            <div key={mo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: m.textLow, width: 28, flexShrink: 0 }}>{mo}</span>
              <div style={{ flex: 1 }}>
                <PillBar m={m} value={scores[i]} max={40} segments={10} height={8} animate={i === 4} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: i === 4 ? m.accent : m.textLow, width: 22, textAlign: "right" }}>{scores[i]}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* AI insight card */}
      <div style={{ borderRadius: 16, background: `linear-gradient(135deg, ${m.gradA}18, ${m.gradB}14)`, border: `1px solid ${m.border}`, padding: "14px 16px", backdropFilter: "blur(16px)" }}>
        <div style={{ fontSize: 10, color: m.accent, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>✦ AI PATTERN — MAY</div>
        <p style={{ margin: 0, fontSize: 13, color: m.textMid, lineHeight: 1.65 }}>
          Your Community score has grown 40% over 5 months while Purpose shows slower gains. Your journal frequently references isolation as a trigger — consider whether expanding your service work might address both dimensions simultaneously.
        </p>
      </div>
    </div>
  );
}

// ── WORKBOOKS (Maya) ──────────────────────────────────────────────────────────
function WorkbooksScreen() {
  const m = MODULES.workbooks;
  const books = [
    { title: "General Recovery", sections: 5, done: 5, pct: 100 },
    { title: "12-Step — Step 4", sections: 3, done: 2, pct: 67 },
    { title: "CBT Engine", sections: 4, done: 1, pct: 25 },
    { title: "SMART Recovery", sections: 6, done: 3, pct: 50 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Overall curriculum progress */}
      <GlassCard m={m}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase" }}>Curriculum</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: m.textHigh }}>11<span style={{ fontSize: 14, color: m.textLow, fontWeight: 400 }}>/18 sections</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: m.textLow }}>Wisdom Score</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: m.accent }}>3,420</div>
          </div>
        </div>
        <PillBar m={m} value={6} max={10} segments={10} height={11} prev={4} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 9, color: m.textLow }}>0%</span>
          <span style={{ fontSize: 9, color: m.accent, fontWeight: 700 }}>61% complete</span>
          <span style={{ fontSize: 9, color: m.textLow }}>100%</span>
        </div>
      </GlassCard>

      {/* Workbook list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {books.map((b, i) => (
          <div key={i} style={{
            borderRadius: 16, overflow: "hidden",
            background: b.pct === 100 ? `linear-gradient(135deg, ${m.gradA}20, ${m.gradB}14)` : "rgba(255,255,255,0.04)",
            border: `1px solid ${b.pct === 100 ? m.border : "rgba(255,255,255,0.07)"}`,
            padding: "12px 14px",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.pct === 100 ? m.textHigh : "rgba(255,255,255,0.75)" }}>{b.title}</div>
                <div style={{ fontSize: 10, color: m.textLow }}>{b.done}/{b.sections} sections</div>
              </div>
              {b.pct === 100
                ? <span style={{ fontSize: 11, fontWeight: 700, color: m.accent, background: m.pillGhost, borderRadius: 999, padding: "3px 8px" }}>Complete ✓</span>
                : <span style={{ fontSize: 13, fontWeight: 800, color: m.textMid }}>{b.pct}%</span>
              }
            </div>
            {/* Section-by-section pill bar */}
            <PillBar m={m} value={b.done} max={b.sections} segments={b.sections} height={9} animate={false} />
          </div>
        ))}
      </div>

      {/* CBT tool quick access */}
      <GlassCard m={m}>
        <div style={{ fontSize: 10, color: m.textLow, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>🧠 CBT Tools</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["ABCDE", "Belief challenger", 3], ["CBA", "Decision matrix", 5], ["DENTS", "Crisis planning", 1], ["Thought Record", "Reframe now", 0]].map(([t, sub, c]) => (
            <div key={t} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.border}`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.textHigh, marginBottom: 2 }}>{t}</div>
              <div style={{ fontSize: 10, color: m.textLow, marginBottom: 8 }}>{sub}</div>
              {/* Mini pill bar for completions */}
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <div key={si} style={{ flex: 1, height: 5, borderRadius: 999, background: si < c ? m.pill : "rgba(255,255,255,0.06)", boxShadow: si < c ? `0 0 4px ${m.glowA}` : "none" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

const SCREENS = { dashboard: DashboardScreen, tasks: TasksScreen, service: ServiceScreen, insights: InsightsScreen, workbooks: WorkbooksScreen };

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [key, setKey] = useState(0);
  const m = MODULES[active];
  const Screen = SCREENS[active];

  const pick = (id) => { setActive(id); setKey(k => k + 1); };

  return (
    <div style={{ minHeight: "100vh", background: m.bg, fontFamily: "-apple-system,'Segoe UI',sans-serif", transition: "background 0.5s ease" }}>

      {/* Module header */}
      <div style={{ position: "relative", overflow: "hidden", padding: "32px 20px 20px", background: `linear-gradient(180deg, ${m.gradA}28 0%, transparent 100%)` }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${m.gradA}30 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 420, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: m.accentDim, textTransform: "uppercase", marginBottom: 4 }}>{m.personaIcon} {m.persona} · {m.vibe}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: m.textHigh }}>{m.label}</h1>
          </div>
          {/* Header accent pill bar */}
          <div style={{ marginTop: 12, display: "flex", gap: 4 }}>
            {MODULE_ORDER.map((id) => (
              <div key={id} style={{ flex: 1, height: 3, borderRadius: 999, background: id === active ? MODULES[id].pill : "rgba(255,255,255,0.08)", boxShadow: id === active ? `0 0 6px ${MODULES[id].glowA}` : "none", transition: "all 0.3s ease" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 16px 100px" }}>
        <div key={key} style={{ animation: "fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <Screen />
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,4,20,0.88)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 0 max(10px, env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 420, margin: "0 auto" }}>
          {MODULE_ORDER.map((id) => {
            const mod = MODULES[id];
            const isActive = id === active;
            return (
              <button key={id} onClick={() => pick(id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 12px", position: "relative" }}>
                {/* Active indicator — 3-pill bar above icon */}
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {[0, 1, 2].map(si => (
                    <div key={si} style={{ width: isActive ? 8 : 4, height: 3, borderRadius: 999, background: isActive ? mod.pill : "transparent", boxShadow: isActive ? `0 0 5px ${mod.glowA}` : "none", transition: "all 0.25s ease" }} />
                  ))}
                </div>
                <span style={{ fontSize: 20, filter: isActive ? "none" : "grayscale(0.4) opacity(0.5)", transition: "filter 0.2s" }}>{mod.icon}</span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? mod.accent : "rgba(255,255,255,0.3)", transition: "color 0.2s" }}>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
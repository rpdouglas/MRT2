import { useState, useEffect } from "react";

const CURRENT = { health: 8, home: 7, purpose: 7, community: 7 };
const PREV    = { health: 6, home: 5, purpose: 6, community: 5 };
const TOTAL   = Object.values(CURRENT).reduce((a, b) => a + b, 0);

const PILLARS = [
  { key: "health",    label: "Health",    icon: "🫀",
    gradA: "#F472B6", gradB: "#EC4899", glow: "#F472B6" },
  { key: "home",      label: "Home",      icon: "🏠",
    gradA: "#FB923C", gradB: "#F59E0B", glow: "#FB923C" },
  { key: "purpose",   label: "Purpose",   icon: "⭐",
    gradA: "#A78BFA", gradB: "#7C3AED", glow: "#A78BFA" },
  { key: "community", label: "Community", icon: "🤝",
    gradA: "#34D399", gradB: "#059669", glow: "#34D399" },
];

// ── shared animated fill hook ──────────────────────────────────────────────
function useSegReveal(run, counts, delay = 60) {
  const [revealed, setRevealed] = useState(counts.map(() => 0));
  useEffect(() => {
    if (!run) { setRevealed(counts.map(() => 0)); return; }
    const timers = [];
    counts.forEach((target, pi) => {
      let seg = 0;
      const t = setTimeout(() => {
        const iv = setInterval(() => {
          seg++;
          setRevealed(prev => { const n = [...prev]; n[pi] = seg; return n; });
          if (seg >= target) clearInterval(iv);
        }, delay + pi * 15);
        timers.push(iv);
      }, pi * 160);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [run]);
  return revealed;
}

// ── shared glass shell ─────────────────────────────────────────────────────
function GlassShell({ children, accentA = "#7C3AED", accentB = "#EC4899" }) {
  return (
    <div style={{
      borderRadius: 24, overflow: "hidden", position: "relative",
      background: `linear-gradient(145deg, ${accentA} 0%, ${accentB} 100%)`,
      padding: 1.5,
    }}>
      <div style={{
        borderRadius: 23,
        background: "rgba(10, 4, 24, 0.60)",
        backdropFilter: "blur(28px) saturate(1.8)",
        WebkitBackdropFilter: "blur(28px) saturate(1.8)",
        padding: "24px 20px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient blobs */}
        <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle, ${accentA}40 0%, transparent 65%)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-20, width:140, height:140, borderRadius:"50%", background:`radial-gradient(circle, ${accentB}30 0%, transparent 65%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── shared header ──────────────────────────────────────────────────────────
function CardHeader({ gain = 4 }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
      <div>
        <div style={{ fontSize:10, letterSpacing:"0.14em", color:"rgba(255,255,255,0.45)", textTransform:"uppercase", marginBottom:4 }}>MAY 2026</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Recovery Capital</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:42, fontWeight:900, color:"#fff", lineHeight:1 }}>{TOTAL}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>/ 40</div>
        <div style={{ fontSize:11, color:"#34D399", fontWeight:700 }}>▲ +{gain} this month</div>
      </div>
    </div>
  );
}

// ── shared pillar label row ────────────────────────────────────────────────
function PillarLabel({ p, cur, prev }) {
  const gain = cur - prev;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>{p.icon}</span>
        <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.88)" }}>{p.label}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>{prev}</span>
        <span style={{ fontSize:21, fontWeight:900, color:"#fff" }}>{cur}</span>
        <span style={{
          fontSize:11, fontWeight:700, color: p.gradA,
          background:`${p.gradA}22`, borderRadius:999, padding:"2px 7px",
        }}>+{gain}</span>
      </div>
    </div>
  );
}

// ── shared legend ──────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ marginTop:20, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:18 }}>
      {[["rgba(255,255,255,0.13)","Last month"],["linear-gradient(90deg,#C026D3,#EC4899)","This month"]].map(([bg, label]) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:22, height:3, background:bg, borderRadius:2 }} />
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// V1 — PILL CAPSULES  (rounded pill segments, slightly spaced)
// ══════════════════════════════════════════════════════════════════════════════
function PillCapsules({ run = true }) {
  const SEG = 10;
  const counts = PILLARS.map(p => CURRENT[p.key]);
  const revealed = useSegReveal(run, counts, 55);

  return (
    <GlassShell accentA="#7C3AED" accentB="#EC4899">
      <CardHeader />
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {PILLARS.map((p, pi) => (
          <div key={p.key}>
            <PillarLabel p={p} cur={CURRENT[p.key]} prev={PREV[p.key]} />
            <div style={{ display:"flex", gap:5 }}>
              {Array.from({ length: SEG }).map((_, si) => {
                const filled  = si < revealed[pi];
                const wasFill = si < PREV[p.key];
                return (
                  <div key={si} style={{
                    flex:1, height:14,
                    borderRadius:999,
                    background: filled
                      ? `linear-gradient(135deg, ${p.gradA}, ${p.gradB})`
                      : wasFill
                        ? "rgba(255,255,255,0.11)"
                        : "rgba(255,255,255,0.04)",
                    boxShadow: filled ? `0 0 10px ${p.glow}77` : "none",
                    border: `1px solid ${filled ? p.gradA+"44" : "rgba(255,255,255,0.06)"}`,
                    transition: filled ? "all 0.18s ease" : "none",
                    transform: filled ? "scaleY(1)" : "scaleY(0.8)",
                    transformOrigin:"center",
                  }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Legend />
    </GlassShell>
  );
}

// ── App Wrapper ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "linear-gradient(160deg, #0C0520 0%, #12042A 60%, #0C0520 100%)", 
      fontFamily: "-apple-system,'Segoe UI',sans-serif",
      padding: 20
    }}>
      <div style={{ width: "100%", maxWidth: 440, animation: "up 0.38s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <PillCapsules />
      </div>
      <style>{`@keyframes up { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
    </div>
  );
}
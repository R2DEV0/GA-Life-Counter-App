"use client";

import { useEffect, useMemo, useState } from "react";

type Picks = number[];

const LS_KEY = "tcg_counter_v1";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueRandoms(max: number, count: number): Picks {
  const safeMax = clampInt(max, 1, 1_000_000);
  const safeCount = clampInt(count, 1, 10_000);
  const finalCount = Math.min(safeCount, safeMax);

  const set = new Set<number>();
  while (set.size < finalCount) set.add(randInt(1, safeMax));
  return Array.from(set);
}

type Press = "none" | "left" | "right";

export default function Page() {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [maxInput, setMaxInput] = useState("4");
  const [countInput, setCountInput] = useState("1");
  const [picks, setPicks] = useState<Picks>([]);

  // touch feedback per player half
  const [p1Press, setP1Press] = useState<Press>("none");
  const [p2Press, setP2Press] = useState<Press>("none");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ p1: number; p2: number }>;
      if (typeof parsed.p1 === "number") setP1(Math.trunc(parsed.p1));
      if (typeof parsed.p2 === "number") setP2(Math.trunc(parsed.p2));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ p1, p2 }));
    } catch {}
  }, [p1, p2]);

  const headerText = useMemo(() => {
    const max = Number(maxInput);
    const cnt = Number(countInput);
    const m = Number.isFinite(max) ? Math.trunc(max) : 0;
    const c = Number.isFinite(cnt) ? Math.trunc(cnt) : 0;
    if (m < 1) return "Random Picker";
    if (c < 1) return `Pick from 1–${m}`;
    return `Pick ${c} from 1–${m}`;
  }, [maxInput, countInput]);

  function resetAll() {
    setP1(0);
    setP2(0);
    setPicks([]);
    setPickerOpen(false);
  }

  function doPick() {
    const max = Number(maxInput);
    const cnt = Number(countInput);
    if (!Number.isFinite(max) || max < 1) return;
    if (!Number.isFinite(cnt) || cnt < 1) return;

    setPicks(uniqueRandoms(max, cnt));
  }

  function press(setter: (v: Press) => void, side: Press) {
    setter(side);
    window.setTimeout(() => setter("none"), 110);
  }

  function Side({
    label,
    value,
    onInc,
    onDec,
    flipped,
    pressState,
    setPressState,
    theme,
  }: {
    label: string;
    value: number;
    onInc: () => void;
    onDec: () => void;
    flipped?: boolean;
    pressState: Press;
    setPressState: (v: Press) => void;
    theme: "pink" | "purple";
  }) {
    const baseBg =
      theme === "pink"
        ? "linear-gradient(180deg, #ffe1ee 0%, #ffd2e7 45%, #ffc4df 100%)"
        : "linear-gradient(180deg, #efe1ff 0%, #e2d0ff 45%, #d7c2ff 100%)";

    // Darken overlay only on the half being touched
    const leftShade = pressState === "left" ? "rgba(0,0,0,.10)" : "rgba(0,0,0,0)";
    const rightShade = pressState === "right" ? "rgba(0,0,0,.10)" : "rgba(0,0,0,0)";

    return (
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "stretch",
          background: baseBg,
          transform: flipped ? "rotate(180deg)" : undefined,
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "manipulation",
        }}
      >
        {/* Left tap zone */}
        <button
          onPointerDown={() => press(setPressState, "left")}
          onClick={onDec}
          style={{
            border: "none",
            background: leftShade,
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
          aria-label={`${label} minus`}
        />

        {/* Right tap zone */}
        <button
          onPointerDown={() => press(setPressState, "right")}
          onClick={onInc}
          style={{
            border: "none",
            background: rightShade,
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
          aria-label={`${label} plus`}
        />

        {/* center overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            padding: 18,
          }}
        >
          <div
            style={{
              textAlign: "center",
              width: "min(360px, 100%)",
              borderRadius: 24,
              background: "rgba(255,255,255,.55)",
              border: "1px solid rgba(255,255,255,.7)",
              boxShadow: "0 18px 40px rgba(0,0,0,.08)",
              padding: "18px 16px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 0.6,
                color: "#2b1a2b",
                opacity: 0.85,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 1,
                color: "#2b1a2b",
                textShadow: "0 2px 0 rgba(255,255,255,.6)",
                marginTop: 6,
              }}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        fontFamily: "system-ui",
      }}
    >
      {/* Top player (flipped for across-table readability) */}
      <Side
        label="Player 1"
        value={p1}
        onInc={() => setP1((v) => v + 1)}
        onDec={() => setP1((v) => v - 1)}
        flipped
        pressState={p1Press}
        setPressState={setP1Press}
        theme="pink"
      />

      {/* Middle bar */}
      <div
        style={{
          padding: 10,
          background: "linear-gradient(90deg, #ffdaf0 0%, #e7d6ff 100%)",
          borderTop: "1px solid rgba(0,0,0,.08)",
          borderBottom: "1px solid rgba(0,0,0,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          onClick={resetAll}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "rgba(255,255,255,.75)",
            color: "#2b1a2b",
            fontWeight: 900,
            boxShadow: "0 10px 20px rgba(0,0,0,.08)",
          }}
        >
          Reset
        </button>

        <button
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: pickerOpen ? "#2b1a2b" : "rgba(255,255,255,.75)",
            color: pickerOpen ? "#fff" : "#2b1a2b",
            fontWeight: 900,
            boxShadow: "0 10px 20px rgba(0,0,0,.08)",
            whiteSpace: "nowrap",
          }}
        >
          Random
        </button>
      </div>

      {/* Random picker modal (FIXED Z-INDEX) */}
      {pickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,

            // ✅ ensure it's above everything
            zIndex: 9999,
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              background: "linear-gradient(180deg, #fff 0%, #fff7fd 55%, #f6f0ff 100%)",
              borderRadius: 20,
              padding: 16,
              border: "1px solid rgba(0,0,0,.08)",
              boxShadow: "0 28px 80px rgba(0,0,0,.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#2b1a2b" }}>{headerText}</div>
              <button
                onClick={() => setPickerOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "rgba(255,255,255,.8)",
                  fontWeight: 900,
                  color: "#2b1a2b",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 6, color: "#2b1a2b" }}>
                Max number (1–max)
              </label>
              <input
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.14)",
                  fontSize: 16,
                  outline: "none",
                }}
                placeholder="20"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 6, color: "#2b1a2b" }}>
                How many picks
              </label>
              <input
                inputMode="numeric"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.14)",
                  fontSize: 16,
                  outline: "none",
                }}
                placeholder="2"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={doPick}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2b1a2b",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                  boxShadow: "0 12px 24px rgba(43,26,43,.22)",
                }}
              >
                Pick
              </button>
              <button
                onClick={() => setPicks([])}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,.14)",
                  background: "rgba(255,255,255,.8)",
                  fontWeight: 900,
                  fontSize: 16,
                  color: "#2b1a2b",
                }}
              >
                Clear
              </button>
            </div>

            {picks.length > 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 16, background: "rgba(43,26,43,.06)" }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#2b1a2b" }}>Result</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {picks.map((n) => (
                    <div
                      key={n}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #ffb9e0 0%, #cdb6ff 100%)",
                        color: "#2b1a2b",
                        fontWeight: 900,
                        minWidth: 44,
                        textAlign: "center",
                        border: "1px solid rgba(0,0,0,.08)",
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom player */}
      <Side
        label="Player 2"
        value={p2}
        onInc={() => setP2((v) => v + 1)}
        onDec={() => setP2((v) => v - 1)}
        pressState={p2Press}
        setPressState={setP2Press}
        theme="purple"
      />
    </main>
  );
}
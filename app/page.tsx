"use client";

import { useEffect, useMemo, useState } from "react";

type Picks = number[];

const LS_KEY = "tcg_counter_v1";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function randInt(min: number, max: number) {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueRandoms(max: number, count: number): Picks {
  const safeMax = clampInt(max, 1, 1_000_000);
  const safeCount = clampInt(count, 1, 10_000);

  // If count > max, we can't do unique numbers. We'll cap to max.
  const finalCount = Math.min(safeCount, safeMax);

  const set = new Set<number>();
  while (set.size < finalCount) set.add(randInt(1, safeMax));
  return Array.from(set);
}

export default function Page() {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [maxInput, setMaxInput] = useState("20");
  const [countInput, setCountInput] = useState("2");
  const [picks, setPicks] = useState<Picks>([]);

  // Restore last scores (nice for accidental refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ p1: number; p2: number }>;
      if (typeof parsed.p1 === "number") setP1(Math.trunc(parsed.p1));
      if (typeof parsed.p2 === "number") setP2(Math.trunc(parsed.p2));
    } catch {}
  }, []);

  // Persist
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
    if (m < 1) return "Pick random numbers";
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

  function Side({
    label,
    value,
    onInc,
    onDec,
    flipped,
  }: {
    label: string;
    value: number;
    onInc: () => void;
    onDec: () => void;
    flipped?: boolean;
  }) {
    return (
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "stretch",
          borderTop: flipped ? "1px solid #222" : "none",
          borderBottom: !flipped ? "1px solid #222" : "none",
          background: "#0b0b0b",
          color: "#fff",
          transform: flipped ? "rotate(180deg)" : undefined, // flips top player for face-to-face
        }}
      >
        {/* Left tap zone = decrement */}
        <button
          onClick={onDec}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
          aria-label={`${label} minus`}
        />

        {/* Right tap zone = increment */}
        <button
          onClick={onInc}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
          aria-label={`${label} plus`}
        />

        {/* Center content overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ opacity: 0.7, fontWeight: 800, letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}>{value}</div>
            <div style={{ opacity: 0.55, fontSize: 12, marginTop: 8 }}>Tap left −1 • Tap right +1</div>
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
        background: "#0b0b0b",
      }}
    >
      {/* Top player (flipped for the player across the table) */}
      <Side label="Player 1" value={p1} onInc={() => setP1((v) => v + 1)} onDec={() => setP1((v) => v - 1)} flipped />

      {/* Middle bar */}
      <div
        style={{
          padding: 10,
          background: "#111",
          borderTop: "1px solid #222",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          onClick={resetAll}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#0b0b0b",
            color: "#fff",
            fontWeight: 900,
          }}
        >
          Reset
        </button>

        <button
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: pickerOpen ? "#fff" : "#0b0b0b",
            color: pickerOpen ? "#0b0b0b" : "#fff",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          Random
        </button>
      </div>

      {/* Random picker panel */}
      {pickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{headerText}</div>
              <button
                onClick={() => setPickerOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 900,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>Max number (range is 1–max)</label>
              <input
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }}
                placeholder="20"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>How many numbers to pick</label>
              <input
                inputMode="numeric"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }}
                placeholder="2"
              />
              <div style={{ opacity: 0.65, fontSize: 13, marginTop: 8 }}>Picks are unique (no duplicates).</div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={doPick}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                Pick
              </button>
              <button
                onClick={() => setPicks([])}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                Clear
              </button>
            </div>

            {picks.length > 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "#f6f6f6" }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Result</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {picks.map((n) => (
                    <div
                      key={n}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 999,
                        background: "#111",
                        color: "#fff",
                        fontWeight: 900,
                        minWidth: 44,
                        textAlign: "center",
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
      <Side label="Player 2" value={p2} onInc={() => setP2((v) => v + 1)} onDec={() => setP2((v) => v - 1)} />
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

type Picks = number[];
type Press = "none" | "left" | "right";

const LS_KEY = "tcg_counter_v2";

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

export default function Page() {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [maxInput, setMaxInput] = useState("4");
  const [countInput, setCountInput] = useState("1");
  const [picks, setPicks] = useState<Picks>([]);

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

  function flashPress(setter: (v: Press) => void, side: Press) {
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
    const rootClasses = [
      "tcg-side",
      theme === "pink" ? "tcg-side--pink" : "tcg-side--purple",
      flipped ? "tcg-side--flipped" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <section className={rootClasses}>
        <button
          className={`tcg-zone tcg-zone--left ${pressState === "left" ? "tcg-zone--pressed" : ""}`}
          aria-label={`${label} minus`}
          onPointerDown={(e) => {
            e.preventDefault();
            flashPress(setPressState, "left");
            onDec();
          }}
        />
        <button
          className={`tcg-zone tcg-zone--right ${pressState === "right" ? "tcg-zone--pressed" : ""}`}
          aria-label={`${label} plus`}
          onPointerDown={(e) => {
            e.preventDefault();
            flashPress(setPressState, "right");
            onInc();
          }}
        />

        <div className="tcg-center" aria-hidden>
          <div className="tcg-card">
            <div className="tcg-label">{label}</div>
            <div className="tcg-value">{value}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="tcg-app">
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

      {/* Middle controls */}
      <div className="tcg-bar">
        <button className="tcg-pill" onClick={resetAll}>
          Reset
        </button>

        <button
          className={`tcg-pill ${pickerOpen ? "tcg-pill--active" : ""}`}
          onClick={() => setPickerOpen((v) => !v)}
        >
          Random
        </button>
      </div>

      {/* Modal */}
      {pickerOpen && (
        <div className="tcg-modalOverlay" onClick={() => setPickerOpen(false)}>
          <div className="tcg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tcg-modalHeader">
              <div className="tcg-modalTitle">{headerText}</div>
              <button className="tcg-pill" onClick={() => setPickerOpen(false)}>
                Close
              </button>
            </div>

            <div className="tcg-field">
              <label className="tcg-fieldLabel">Max number (1–max)</label>
              <input
                className="tcg-input"
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                placeholder="20"
              />
            </div>

            <div className="tcg-field">
              <label className="tcg-fieldLabel">How many picks</label>
              <input
                className="tcg-input"
                inputMode="numeric"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                placeholder="2"
              />
              <div className="tcg-muted">Unique picks (no duplicates).</div>
            </div>

            <div className="tcg-actions">
              <button className="tcg-btnPrimary" onClick={doPick}>
                Pick
              </button>
              <button className="tcg-btnGhost" onClick={() => setPicks([])}>
                Clear
              </button>
            </div>

            {picks.length > 0 && (
              <div className="tcg-results">
                <div className="tcg-resultsTitle">Result</div>
                <div className="tcg-chips">
                  {picks.map((n) => (
                    <div key={n} className="tcg-chip">
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
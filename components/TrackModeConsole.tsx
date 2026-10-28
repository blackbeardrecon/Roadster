'use client';

import React from 'react';
import {ChevronLeft, LogOut} from 'lucide-react';
import {
  AeroLoadState,
  CockpitState,
  FanModeState,
  FrontWingState,
  RearWingState,
  SESSION_LAP_HISTORY_LEFT,
  SESSION_LAP_HISTORY_RIGHT,
  TrackAeroProfile,
  calculateBalanceSplit,
} from '@/lib/roadster-state';

interface TrackModeConsoleProps {
  state: CockpitState;
  onToggleTrackSubView: (view: 'Dashboard' | 'Setup') => void;
  onExitTrackMode: () => void;
  onSelectTrackProfile: (profile: TrackAeroProfile) => void;
  onChangeFrontWing: (wing: FrontWingState) => void;
  onChangeRearWing: (wing: RearWingState) => void;
  onChangeAeroLoad: (load: AeroLoadState) => void;
  onChangeFanMode: (fan: FanModeState) => void;
  onChangeAeroBalance: (step: number) => void;
  onChangeBrakeBalance: (step: number) => void;
  onToggleHoodVent: (open: boolean) => void;
  onToggleBargeBoard: (deploy: boolean) => void;
  onToggleEsc: () => void;
  onToggleTcs: () => void;
  onTriggerBoost: () => void;
}

// Circuit SVG path points for the isometric track in ui_2.jpg
const TRACK_POINTS: [number, number][] = [
  [280, 265],
  [72, 185],
  [128, 152],
  [182, 182],
  [215, 178],
  [246, 155],
  [248, 132],
  [222, 115],
  [242, 108],
  [262, 122],
  [448, 56],
  [458, 66],
  [412, 95],
  [392, 118],
  [372, 108],
  [350, 128],
  [325, 175],
  [302, 196],
  [300, 224],
  [318, 255],
  [280, 265],
];

function getPointAlongTrack(progress: number): {x: number; y: number; angleDeg: number} {
  const norm = ((progress % 1) + 1) % 1;
  const totalSegs = TRACK_POINTS.length - 1;
  const exactIdx = norm * totalSegs;
  const idx = Math.min(totalSegs - 1, Math.floor(exactIdx));
  const frac = exactIdx - idx;
  const [x1, y1] = TRACK_POINTS[idx];
  const [x2, y2] = TRACK_POINTS[idx + 1];
  const x = x1 + (x2 - x1) * frac;
  const y = y1 + (y2 - y1) * frac;
  const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  return {x, y, angleDeg};
}

function TopDownCarOutline() {
  return (
    <svg viewBox="0 0 80 150" className="w-[54px] h-[106px] stroke-[#ff1a1a]/60 fill-none">
      {/* Outer Fuselage */}
      <path
        d="M24 12 Q40 4 56 12 L64 38 L62 118 Q60 138 40 140 Q20 138 18 118 L16 38 Z"
        strokeWidth="1.2"
      />
      {/* Hood & Canopy Lines */}
      <path d="M22 42 Q40 34 58 42 L54 88 Q40 94 26 88 Z" strokeWidth="1" />
      <path d="M26 88 L22 124 M54 88 L58 124" strokeWidth="0.9" />
      <line x1="40" y1="10" x2="40" y2="36" strokeWidth="0.8" />
    </svg>
  );
}

export default function TrackModeConsole({
  state,
  onToggleTrackSubView,
  onExitTrackMode,
  onSelectTrackProfile,
  onChangeFrontWing,
  onChangeRearWing,
  onChangeAeroLoad,
  onChangeFanMode,
  onChangeAeroBalance,
  onChangeBrakeBalance,
  onToggleHoodVent,
  onToggleBargeBoard,
  onToggleEsc,
  onToggleTcs,
  onTriggerBoost,
}: TrackModeConsoleProps) {
  if (state.trackModeView === 'Off') return null;

  const isSetup = state.trackModeView === 'Setup';
  const isCustomSetup = state.trackAeroProfile === 'Custom';
  const aeroSplit = calculateBalanceSplit(
    state.aeroBalanceStep,
    'aero',
    isSetup,
    isCustomSetup
  );
  const brakeSplit = calculateBalanceSplit(
    state.brakeBalanceStep,
    'brake',
    isSetup,
    isCustomSetup
  );
  const carMarker = getPointAlongTrack(state.trackProgress);

  return (
    <div
      className="absolute inset-0 top-10 bg-black/90 z-30 flex flex-col justify-between px-4 pt-2 pb-0 select-none"
      data-testid="track-mode-console"
    >
      {!isSetup ? (
        /* =====================================================================
           TRACK MODE DASHBOARD VIEW (1:1 with ui_2.jpg / sec_14.jpg..sec_15.jpg & sec_20.jpg..sec_22.jpg)
           ===================================================================== */
        <div className="flex-1 grid grid-cols-12 gap-2.5 min-h-0 pb-2.5">
          {/* COLUMN 1: Brake, Regen, Battery Temp, Motor Temp, Brake Temp (Cols 1-2) */}
          <div className="col-span-2 flex flex-col gap-2.5 min-h-0">
            {/* Brake % */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between h-[68px]">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Brake</span>
                <span className="font-mono tabular-nums font-semibold">
                  {state.brakePedalPct}%
                </span>
              </div>
              <div className="relative h-2 bg-[#2a0404] border-b border-[#ff1a1a]/50 overflow-hidden">
                <div
                  style={{width: `${state.brakePedalPct}%`}}
                  className="h-full bg-gradient-to-r from-[#800a0a] to-[#ff1a1a]"
                />
                <div className="absolute inset-0 flex justify-evenly items-end pointer-events-none">
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                </div>
              </div>
            </div>

            {/* Regen */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between h-[68px]">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Regen</span>
              </div>
              <div className="relative h-2 bg-[#2a0404] border-b border-[#ff1a1a]/50 overflow-hidden">
                <div
                  style={{width: `${state.regenPct}%`}}
                  className="h-full bg-gradient-to-r from-[#800a0a] to-[#ff1a1a]"
                />
                <div className="absolute inset-0 flex justify-evenly items-end pointer-events-none">
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                </div>
              </div>
            </div>

            {/* Battery Temp */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between h-[68px]">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Battery Temp</span>
                <span className="font-mono tabular-nums font-semibold">
                  {state.batteryTempF}°F
                </span>
              </div>
              <div className="relative h-2 bg-[#2a0404] border-b border-[#ff1a1a]/50 overflow-hidden">
                <div
                  style={{width: '38%'}}
                  className="h-full bg-gradient-to-r from-[#800a0a] to-[#ff1a1a]"
                />
                <div className="absolute inset-0 flex justify-evenly items-end pointer-events-none">
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                </div>
              </div>
            </div>

            {/* Motor Temp */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between h-[68px]">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Motor Temp</span>
                <span className="font-mono tabular-nums font-semibold">
                  {state.motorTempF}°F
                </span>
              </div>
              <div className="relative h-2 bg-[#2a0404] border-b border-[#ff1a1a]/50 overflow-hidden">
                <div
                  style={{width: '48%'}}
                  className="h-full bg-gradient-to-r from-[#800a0a] to-[#ff1a1a]"
                />
                <div className="absolute inset-0 flex justify-evenly items-end pointer-events-none">
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                </div>
              </div>
            </div>

            {/* Brake Temp °F Car Schematic */}
            <div className="flex-1 bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Brake Temp</span>
                <span className="text-[#a11b1b] font-mono">°F</span>
              </div>

              <div className="flex-1 flex items-center justify-center relative my-1">
                <TopDownCarOutline />
                {/* FL Brake */}
                <div className="absolute left-2 top-3 flex items-center gap-1.5">
                  <span className="text-[11px] font-mono tabular-nums text-[#ff1a1a]">
                    {state.tires[0].brakeTempF}°
                  </span>
                  <span className="w-1 h-3.5 border border-[#ff1a1a] bg-[#ff1a1a]/40" />
                </div>
                {/* FR Brake */}
                <div className="absolute right-2 top-3 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 border border-[#ff1a1a] bg-[#ff1a1a]/40" />
                  <span className="text-[11px] font-mono tabular-nums text-[#ff1a1a]">
                    {state.tires[1].brakeTempF}°
                  </span>
                </div>
                {/* RL Brake */}
                <div className="absolute left-2 bottom-3 flex items-center gap-1.5">
                  <span className="text-[11px] font-mono tabular-nums text-[#ff1a1a]">
                    {state.tires[2].brakeTempF}°
                  </span>
                  <span className="w-1 h-3.5 border border-[#ff1a1a] bg-[#ff1a1a]/40" />
                </div>
                {/* RR Brake */}
                <div className="absolute right-2 bottom-3 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 border border-[#ff1a1a] bg-[#ff1a1a]/40" />
                  <span className="text-[11px] font-mono tabular-nums text-[#ff1a1a]">
                    {state.tires[3].brakeTempF}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Accel, G-Force Meter, Tire PSI · °F (Cols 3-4) */}
          <div className="col-span-2 flex flex-col gap-2.5 min-h-0">
            {/* Accel % */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between h-[68px]">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Accel</span>
                <span className="font-mono tabular-nums font-semibold">
                  {state.accelPedalPct}%
                </span>
              </div>
              <div className="relative h-2 bg-[#2a0404] border-b border-[#ff1a1a]/50 overflow-hidden">
                <div
                  style={{width: `${state.accelPedalPct}%`}}
                  className="h-full bg-gradient-to-r from-[#800a0a] to-[#ff1a1a]"
                />
                <div className="absolute inset-0 flex justify-evenly items-end pointer-events-none">
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                  <span className="w-[1px] h-1.5 bg-[#ff1a1a]/60" />
                </div>
              </div>
            </div>

            {/* G-Force Meter (3.5G Circular Reticle with Radial Tick Marks & Trail) */}
            <div className="h-[224px] bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between relative">
              <div className="text-xs text-[#ff1a1a]">Meter</div>
              <div className="flex-1 flex items-center justify-center relative">
                {/* 3.5G Cardinal Labels */}
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[11px] font-mono text-[#ff1a1a]">
                  3.5
                </span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] font-mono text-[#ff1a1a]">
                  3.5
                </span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#ff1a1a]">
                  3.5
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#ff1a1a]">
                  3.5
                </span>

                {/* Radial Tick Marks & Center Crosshair */}
                <div className="relative w-28 h-28 rounded-full border border-[#ff1a1a]/20 flex items-center justify-center">
                  {/* Radial tick ring */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                    {Array.from({length: 24}).map((_, idx) => {
                      const angle = (idx * 15 * Math.PI) / 180;
                      const r1 = idx % 2 === 0 ? 44 : 46;
                      const r2 = 49;
                      const x1 = 50 + r1 * Math.cos(angle);
                      const y1 = 50 + r1 * Math.sin(angle);
                      const x2 = 50 + r2 * Math.cos(angle);
                      const y2 = 50 + r2 * Math.sin(angle);
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#ff1a1a"
                          strokeOpacity={idx % 2 === 0 ? 0.45 : 0.22}
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>

                  <span className="text-[#ff1a1a]/40 text-xs select-none">+</span>

                  {/* Dynamic G-Force Indicator Ball with Motion Trail */}
                  <div
                    style={{
                      transform: `translate(${(state.gForceX / 3.5) * 42}px, ${
                        (-state.gForceY / 3.5) * 42
                      }px)`,
                    }}
                    className="absolute w-4 h-4 rounded-full border-2 border-[#ff1a1a] bg-[#ff1a1a]/40 shadow-[0_0_12px_#ff1a1a] transition-transform duration-150"
                  >
                    <span className="block w-2 h-4 bg-gradient-to-t from-[#ff1a1a]/70 to-transparent mx-auto -mt-3.5 rounded-full blur-[1px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tire PSI · °F Schematic */}
            <div className="flex-1 bg-[#120202]/95 border border-[#ff1a1a]/15 p-3 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between text-xs text-[#ff1a1a]">
                <span>Tire</span>
                <span className="text-[#a11b1b] font-mono">PSI · °F</span>
              </div>

              <div className="flex-1 flex items-center justify-center relative my-1">
                <TopDownCarOutline />
                {/* FL Tire */}
                <div className="absolute left-1.5 top-2.5 flex items-center gap-1.5">
                  <div className="text-right font-mono tabular-nums leading-tight">
                    <div className="text-[11px] text-[#ff1a1a] font-semibold">
                      {state.tires[0].psi}
                    </div>
                    <div className="text-[10px] text-[#ff1a1a]">{state.tires[0].tempF}°</div>
                  </div>
                  <span className="w-2 h-4 rounded-[2px] bg-[#ff1a1a]" />
                </div>
                {/* FR Tire */}
                <div className="absolute right-1.5 top-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-4 rounded-[2px] bg-[#ff1a1a]" />
                  <div className="text-left font-mono tabular-nums leading-tight">
                    <div className="text-[11px] text-[#ff1a1a] font-semibold">
                      {state.tires[1].psi}
                    </div>
                    <div className="text-[10px] text-[#ff1a1a]">{state.tires[1].tempF}°</div>
                  </div>
                </div>
                {/* RL Tire */}
                <div className="absolute left-1.5 bottom-2.5 flex items-center gap-1.5">
                  <div className="text-right font-mono tabular-nums leading-tight">
                    <div className="text-[11px] text-[#ff1a1a] font-semibold">
                      {state.tires[2].psi}
                    </div>
                    <div className="text-[10px] text-[#ff1a1a]">{state.tires[2].tempF}°</div>
                  </div>
                  <span className="w-2 h-4 rounded-[2px] bg-[#ff1a1a]" />
                </div>
                {/* RR Tire */}
                <div className="absolute right-1.5 bottom-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-4 rounded-[2px] bg-[#ff1a1a]" />
                  <div className="text-left font-mono tabular-nums leading-tight">
                    <div className="text-[11px] text-[#ff1a1a] font-semibold">
                      {state.tires[3].psi}
                    </div>
                    <div className="text-[10px] text-[#ff1a1a]">{state.tires[3].tempF}°</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Center Wide Lap Circuit Map & Session Lap History (Cols 5-9) */}
          <div className="col-span-5 flex flex-col gap-2.5 min-h-0">
            {/* Top 3D Isometric Circuit Map Box */}
            <div className="h-[302px] bg-[#120202]/95 border border-[#ff1a1a]/15 p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between z-10">
                <span className="text-xs text-[#ff1a1a]">Lap</span>
                <div className="text-right">
                  <div className="text-xs text-[#b91c1c]">Elevation</div>
                  <div className="text-xs font-mono tabular-nums text-[#ff1a1a] font-semibold">
                    {state.elevationFt} ft
                  </div>
                </div>
              </div>

              {/* Isometric Circuit SVG with Dot-Matrix Grid, Elevation Curtain & White Pilot Delta */}
              <svg
                viewBox="0 0 500 280"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <linearGradient id="trackCurtain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff1a1a" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#ff1a1a" stopOpacity="0.0" />
                  </linearGradient>
                  <pattern
                    id="lapDotMatrix"
                    x="0"
                    y="0"
                    width="14"
                    height="14"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="0.85" fill="#ff1a1a" fillOpacity="0.22" />
                  </pattern>
                </defs>

                {/* Subtle Red Dot-Matrix Background Grid */}
                <rect x="0" y="0" width="500" height="280" fill="url(#lapDotMatrix)" />

                {/* Vertical Elevation Drop Bars along Track */}
                {TRACK_POINTS.map(([px, py], i) => (
                  <line
                    key={i}
                    x1={px}
                    y1={py}
                    x2={px}
                    y2={py + 22}
                    stroke="url(#trackCurtain)"
                    strokeWidth="2.5"
                  />
                ))}

                {/* Glowing Crimson Circuit Path */}
                <polyline
                  fill="none"
                  stroke="#ff1a1a"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={TRACK_POINTS.map(([px, py]) => `${px},${py}`).join(' ')}
                />

                {/* White Pilot Arrow Marker */}
                <g
                  transform={`translate(${carMarker.x}, ${carMarker.y}) rotate(${carMarker.angleDeg})`}
                >
                  <polygon points="0,-11 8,9 0,5 -8,9" fill="#ffffff" />
                </g>
              </svg>

              {/* Sector Splits Bottom-Right */}
              <div className="self-end z-10 flex flex-col gap-1 text-xs font-mono tabular-nums w-24">
                <div className="flex justify-between text-[#ff1a1a]">
                  <span>S1</span>
                  <span>{state.sector1Time}</span>
                </div>
                <div className="flex justify-between text-[#801313]">
                  <span>S2</span>
                  <span>{state.sector2Time}</span>
                </div>
                <div className="flex justify-between text-[#801313]">
                  <span>S3</span>
                  <span>{state.sector3Time}</span>
                </div>
              </div>
            </div>

            {/* Bottom Session Lap Times Box */}
            <div className="flex-1 bg-[#120202]/95 border border-[#ff1a1a]/15 p-3.5 flex flex-col justify-between min-h-0">
              <div className="text-xs text-[#ff1a1a]">Session</div>

              <div className="flex-1 grid grid-cols-12 gap-4 items-center pt-1">
                {/* Left Last / Best Readouts */}
                <div className="col-span-4 flex flex-col justify-between h-full py-1">
                  <div>
                    <div className="text-xs text-[#b91c1c] mb-0.5">Last</div>
                    <div className="text-xl font-mono tabular-nums text-[#ff1a1a] font-semibold tracking-tight">
                      {state.lastLapTime}
                    </div>
                  </div>
                  <div className="h-[1px] bg-[#ff1a1a]/15 my-1" />
                  <div>
                    <div className="text-xs text-[#b91c1c] mb-0.5">Best</div>
                    <div className="text-xl font-mono tabular-nums text-[#ff1a1a] font-semibold tracking-tight">
                      {state.bestLapTime}
                    </div>
                  </div>
                </div>

                {/* Right 2-Column Lap Table (Laps 23..19 and 18..14) */}
                <div className="col-span-8 grid grid-cols-2 gap-x-6 text-xs font-mono tabular-nums">
                  <div className="flex flex-col gap-2">
                    {SESSION_LAP_HISTORY_LEFT.map((row) => (
                      <div
                        key={row.lap}
                        className={`flex items-center justify-between ${
                          row.lap === 23 ? 'text-[#ff1a1a] font-semibold' : 'text-[#b91c1c]'
                        }`}
                      >
                        <span>{row.lap}</span>
                        <span>{row.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {SESSION_LAP_HISTORY_RIGHT.map((row) => (
                      <div
                        key={row.lap}
                        className="flex items-center justify-between text-[#a11b1b]"
                      >
                        <span>{row.lap}</span>
                        <span>{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 4: Right Dynamics, Fan, Brake Balance, Aero Balance, ESC/TCS (Cols 10-12) */}
          <div className="col-span-3 flex flex-col gap-2.5 min-h-0">
            {/* Dynamics Summary Card */}
            <div
              onClick={() => onToggleTrackSubView('Setup')}
              className="bg-[#120202]/95 border border-[#ff1a1a]/15 hover:border-[#ff1a1a]/50 cursor-pointer p-3.5 flex flex-col justify-between h-[210px] transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b91c1c]">Dynamics</span>
                <span className="text-[#ff1a1a] font-semibold">{state.trackAeroProfile}</span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#b91c1c]">Front Wing</span>
                  <span className="text-[#ff1a1a] font-medium">{state.frontWing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b91c1c]">Rear Wing</span>
                  <span className="text-[#ff1a1a] font-medium">{state.rearWing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b91c1c]">Hood Vent</span>
                  <span className="text-[#ff1a1a] font-medium">
                    {state.hoodVentOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b91c1c]">Barge Boards</span>
                  <span className="text-[#ff1a1a] font-medium">
                    {state.bargeBoardDeployed ? 'Deploy' : 'Retract'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b91c1c]">Aero Load</span>
                  <span className="text-[#ff1a1a] font-medium">{state.aeroLoad}</span>
                </div>
              </div>
            </div>

            {/* Fan Status Box */}
            <button
              type="button"
              onClick={() =>
                onChangeFanMode(state.fanMode === 'Off' ? 'Max Grip' : 'Off')
              }
              className="bg-[#120202]/95 border border-[#ff1a1a]/15 hover:border-[#ff1a1a]/50 p-3.5 flex flex-col justify-between h-[82px] text-left transition-colors"
            >
              <div className="w-full flex items-center justify-between text-xs">
                <span className="text-[#b91c1c]">Fan</span>
                <span className="text-[#ff1a1a] font-semibold">
                  {state.fanMode === 'Off' ? 'OFF' : 'ON'}
                </span>
              </div>
              <div className="text-xs text-[#ff1a1a] font-medium">{state.fanMode}</div>
            </button>

            {/* Brake Balance Box */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3.5 flex flex-col justify-between h-[74px]">
              <div className="text-xs text-[#b91c1c]">Brake Balance</div>
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <button
                  type="button"
                  onClick={() => onChangeBrakeBalance(state.brakeBalanceStep - 1)}
                  className="text-[#b91c1c] hover:text-[#ff1a1a]"
                >
                  {brakeSplit.frontPct}%
                </button>
                <span className="text-[#ff1a1a] font-bold">{brakeSplit.formattedStep}</span>
                <button
                  type="button"
                  onClick={() => onChangeBrakeBalance(state.brakeBalanceStep + 1)}
                  className="text-[#b91c1c] hover:text-[#ff1a1a]"
                >
                  {brakeSplit.rearPct}%
                </button>
              </div>
            </div>

            {/* Aero Balance Box */}
            <div className="bg-[#120202]/95 border border-[#ff1a1a]/15 p-3.5 flex flex-col justify-between h-[74px]">
              <div className="text-xs text-[#b91c1c]">Aero Balance</div>
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <button
                  type="button"
                  onClick={() => onChangeAeroBalance(state.aeroBalanceStep - 1)}
                  className="text-[#b91c1c] hover:text-[#ff1a1a]"
                >
                  {aeroSplit.frontPct}%
                </button>
                <span className="text-[#ff1a1a] font-bold">{aeroSplit.formattedStep}</span>
                <button
                  type="button"
                  onClick={() => onChangeAeroBalance(state.aeroBalanceStep + 1)}
                  className="text-[#b91c1c] hover:text-[#ff1a1a]"
                >
                  {aeroSplit.rearPct}%
                </button>
              </div>
            </div>

            {/* ESC / TCS Split Row */}
            <div className="flex-1 grid grid-cols-2 gap-2.5 min-h-[64px]">
              <button
                type="button"
                onClick={onToggleEsc}
                className="bg-[#120202]/95 border border-[#ff1a1a]/15 hover:border-[#ff1a1a]/50 p-3 flex flex-col justify-between text-left"
              >
                <span className="text-xs text-[#b91c1c]">ESC</span>
                <span className="text-xs font-semibold text-[#ff1a1a]">
                  {state.escEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                type="button"
                onClick={onToggleTcs}
                className="bg-[#120202]/95 border border-[#ff1a1a]/15 hover:border-[#ff1a1a]/50 p-3 flex flex-col justify-between text-left"
              >
                <span className="text-xs text-[#b91c1c]">TCS</span>
                <span className="text-xs font-semibold text-[#ff1a1a]">
                  {state.tcsEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           TRACK MODE SETUP VIEW (1:1 with sec_16.jpg & sec_18.jpg)
           ===================================================================== */
        <div className="flex-1 flex items-center justify-center relative px-16 pb-3 min-h-0">
          {/* Left Back Chevron */}
          <button
            type="button"
            aria-label="Back to Track Mode Dashboard"
            onClick={() => onToggleTrackSubView('Dashboard')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#ff1a1a] hover:scale-110 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="w-full max-w-[1120px] h-full flex flex-col justify-between gap-2.5">
            {/* Top 4 Profile Cards: Auto | Low Drag | High Downforce | Custom */}
            <div className="grid grid-cols-4 gap-3 h-[128px]">
              {(
                ['Auto', 'Low Drag', 'High Downforce', 'Custom'] as TrackAeroProfile[]
              ).map((profile) => {
                const isActive = state.trackAeroProfile === profile;
                return (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => onSelectTrackProfile(profile)}
                    className={`p-4 flex flex-col justify-between text-left transition-all border ${
                      isActive
                        ? 'bg-[#3d0606]/90 border-[#ff1a1a] shadow-[0_0_25px_rgba(255,26,26,0.35)]'
                        : 'bg-[#1c0303]/85 border-[#ff1a1a]/15 hover:border-[#ff1a1a]/50'
                    }`}
                  >
                    <span
                      className={`text-[10px] uppercase tracking-widest font-mono ${
                        isActive ? 'text-[#ff1a1a]' : 'text-[#8c1414]'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'SELECT'}
                    </span>
                    <span
                      className={`text-xl font-medium ${
                        isActive ? 'text-[#ff1a1a]' : 'text-[#a31919]'
                      }`}
                    >
                      {profile}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Middle 2-Column Matrix */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
              {/* Left 4 Segmented Rows: Front Wing, Rear Wing, Aero Load, Fan */}
              <div className="flex flex-col gap-2.5 justify-between">
                {/* Front Wing */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 px-5 flex items-center justify-between">
                  <span className="text-xs text-[#ff1a1a] font-medium">Front Wing</span>
                  <div className="flex items-center gap-2">
                    {(['Low Drag', 'High Downforce'] as FrontWingState[]).map((m) => {
                      const active = state.frontWing === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => onChangeFrontWing(m)}
                          className={`px-3.5 py-2 text-xs border transition-all ${
                            active
                              ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                              : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rear Wing */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 px-5 flex items-center justify-between">
                  <span className="text-xs text-[#ff1a1a] font-medium">Rear Wing</span>
                  <div className="flex items-center gap-2">
                    {(['Stowed', 'Low Drag', 'High Downforce'] as RearWingState[]).map(
                      (m) => {
                        const active = state.rearWing === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onChangeRearWing(m)}
                            className={`px-3.5 py-2 text-xs border transition-all ${
                              active
                                ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                                : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Aero Load */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 px-5 flex items-center justify-between">
                  <span className="text-xs text-[#ff1a1a] font-medium">Aero Load</span>
                  <div className="flex items-center gap-2">
                    {(['Low Drag', 'Balance', 'Max Grip'] as AeroLoadState[]).map((m) => {
                      const active = state.aeroLoad === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => onChangeAeroLoad(m)}
                          className={`px-3.5 py-2 text-xs border transition-all ${
                            active
                              ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                              : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fan */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 px-5 flex items-center justify-between">
                  <span className="text-xs text-[#ff1a1a] font-medium">Fan</span>
                  <div className="flex items-center gap-2">
                    {(['Off', 'Braking', 'Low Drag', 'Max Grip'] as FanModeState[]).map(
                      (m) => {
                        const active = state.fanMode === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onChangeFanMode(m)}
                            className={`px-3.5 py-2 text-xs border transition-all ${
                              active
                                ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                                : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Right 2 Large Balance Modules: Aero Balance (+3 / +1) & Brake Balance (-1) */}
              <div className="flex flex-col gap-2.5 justify-between">
                {/* Aero Balance */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 p-5 flex flex-col justify-between">
                  <div className="text-xs text-[#ff1a1a] font-medium">Aero Balance</div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onChangeAeroBalance(state.aeroBalanceStep - 1)}
                      className="text-left group"
                    >
                      <div className="text-[10px] font-mono text-[#8c1414]">FRONT</div>
                      <div className="text-sm font-mono tabular-nums text-[#b91c1c] group-hover:text-[#ff1a1a]">
                        {aeroSplit.frontPct}%
                      </div>
                    </button>

                    <div className="text-5xl font-mono tabular-nums text-[#ff1a1a] tracking-tight">
                      {aeroSplit.formattedStep}
                    </div>

                    <button
                      type="button"
                      onClick={() => onChangeAeroBalance(state.aeroBalanceStep + 1)}
                      className="text-right group"
                    >
                      <div className="text-[10px] font-mono text-[#8c1414]">REAR</div>
                      <div className="text-sm font-mono tabular-nums text-[#b91c1c] group-hover:text-[#ff1a1a]">
                        {aeroSplit.rearPct}%
                      </div>
                    </button>
                  </div>

                  {/* 7-Dot Balance Stepper */}
                  <div className="flex items-center justify-center gap-3">
                    {[-3, -2, -1, 0, 1, 2, 3].map((dotStep) => (
                      <button
                        key={dotStep}
                        type="button"
                        aria-label={`Set Aero Balance ${dotStep}`}
                        onClick={() => onChangeAeroBalance(dotStep)}
                        className={`w-1.5 h-1.5 rotate-45 transition-all ${
                          state.aeroBalanceStep === dotStep
                            ? 'bg-[#ff1a1a] scale-125'
                            : 'bg-[#6b1111]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Brake Balance */}
                <div className="flex-1 bg-[#1c0303]/85 border border-[#ff1a1a]/20 p-5 flex flex-col justify-between">
                  <div className="text-xs text-[#ff1a1a] font-medium">Brake Balance</div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onChangeBrakeBalance(state.brakeBalanceStep - 1)}
                      className="text-left group"
                    >
                      <div className="text-[10px] font-mono text-[#8c1414]">FRONT</div>
                      <div className="text-sm font-mono tabular-nums text-[#b91c1c] group-hover:text-[#ff1a1a]">
                        {brakeSplit.frontPct}%
                      </div>
                    </button>

                    <div className="text-5xl font-mono tabular-nums text-[#ff1a1a] tracking-tight">
                      {brakeSplit.formattedStep}
                    </div>

                    <button
                      type="button"
                      onClick={() => onChangeBrakeBalance(state.brakeBalanceStep + 1)}
                      className="text-right group"
                    >
                      <div className="text-[10px] font-mono text-[#8c1414]">REAR</div>
                      <div className="text-sm font-mono tabular-nums text-[#b91c1c] group-hover:text-[#ff1a1a]">
                        {brakeSplit.rearPct}%
                      </div>
                    </button>
                  </div>

                  {/* 7-Dot Balance Stepper */}
                  <div className="flex items-center justify-center gap-3">
                    {[-3, -2, -1, 0, 1, 2, 3].map((dotStep) => (
                      <button
                        key={dotStep}
                        type="button"
                        aria-label={`Set Brake Balance ${dotStep}`}
                        onClick={() => onChangeBrakeBalance(dotStep)}
                        className={`w-1.5 h-1.5 rotate-45 transition-all ${
                          state.brakeBalanceStep === dotStep
                            ? 'bg-[#ff1a1a] scale-125'
                            : 'bg-[#6b1111]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 4 Action Cards: Hood Vent | Barge Boards | ESC | TCS */}
            <div className="grid grid-cols-4 gap-3 h-[68px]">
              <button
                type="button"
                onClick={() => onToggleHoodVent(!state.hoodVentOpen)}
                className="bg-[#1c0303]/85 border border-[#ff1a1a]/25 hover:border-[#ff1a1a] px-5 flex items-center justify-between transition-all"
              >
                <span className="text-xs text-[#ff1a1a] font-medium">Hood Vent</span>
                <span className="text-xs text-[#a31919]">
                  {state.hoodVentOpen ? 'Open' : 'Closed'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBargeBoard(!state.bargeBoardDeployed)}
                className="bg-[#2b0404]/90 border border-[#ff1a1a] px-5 flex items-center justify-between shadow-[0_0_20px_rgba(255,26,26,0.25)]"
              >
                <span className="text-xs text-[#ff1a1a] font-medium">Barge Boards</span>
                <span className="text-xs text-[#ff1a1a]">
                  {state.bargeBoardDeployed ? 'Deploy' : 'Retract'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleEsc}
                className="bg-[#2b0404]/90 border border-[#ff1a1a] px-5 flex items-center justify-between shadow-[0_0_20px_rgba(255,26,26,0.25)]"
              >
                <span className="text-xs text-[#ff1a1a] font-medium">ESC</span>
                <span className="text-xs text-[#ff1a1a]">
                  {state.escEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleTcs}
                className="bg-[#2b0404]/90 border border-[#ff1a1a] px-5 flex items-center justify-between shadow-[0_0_20px_rgba(255,26,26,0.25)]"
              >
                <span className="text-xs text-[#ff1a1a] font-medium">TCS</span>
                <span className="text-xs text-[#ff1a1a]">
                  {state.tcsEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
         BOTTOM TRACK MODE STATUS & THRUSTER 5,500 PSI BAR
         ===================================================================== */}
      <div className="h-12 grid grid-cols-12 items-center border-t border-[#ff1a1a]/20 bg-black">
        {/* Left Setup / Dashboard Switch Button */}
        <div className="col-span-2 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleTrackSubView(isSetup ? 'Dashboard' : 'Setup')}
            className="text-xs text-[#ff1a1a] hover:text-white font-medium tracking-wide px-4 py-2"
          >
            {isSetup ? 'Dashboard' : 'Setup'}
          </button>
        </div>

        {/* Center Glowing SpaceX Cold-Gas Thruster · 5,500 PSI Bar */}
        <button
          type="button"
          onClick={onTriggerBoost}
          className="col-span-8 h-full px-6 flex items-center justify-between bg-gradient-to-t from-[#540606] via-[#2b0303] to-transparent border-b-2 border-[#ff1a1a] hover:from-[#750808] transition-all cursor-pointer"
        >
          <span className="text-xs font-mono tabular-nums text-[#ff1a1a] font-semibold tracking-wide">
            Thruster · {state.thrusterPsi.toLocaleString()} PSI
          </span>
          <span className="text-xs font-mono tabular-nums text-[#ff1a1a] font-semibold tracking-wide">
            {state.thrusterPct}% · {state.boostFiring ? 'Boost Firing' : 'Boost Ready'}
          </span>
        </button>

        {/* Right Exit Track Mode Button */}
        <div className="col-span-2 flex items-center justify-center">
          <button
            type="button"
            onClick={onExitTrackMode}
            className="flex items-center gap-2 text-xs text-[#ff1a1a] hover:text-white font-medium px-4 py-2"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180" />
            <span>Exit Track Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {Flag} from 'lucide-react';
import {
  CameraPreset,
  CockpitState,
  DynamicsPreset,
  ExteriorLightsState,
  FrontWingState,
  RearWingState,
} from '@/lib/roadster-state';

interface VehicleOverlaysProps {
  state: CockpitState;
  onSelectDynamicsPreset: (preset: DynamicsPreset) => void;
  onEnterTrackMode: () => void;
  onChangeAcceleration: (mode: 'Chill' | 'Standard' | 'Sport') => void;
  onChangeRideHandling: (mode: 'Comfort' | 'Balance' | 'Sport') => void;
  onChangeFrontWing: (wing: FrontWingState) => void;
  onChangeRearWing: (wing: RearWingState) => void;
  onChangeSuspension: (mode: 'Standard' | 'Low') => void;
  onToggleHoodVent: (open: boolean) => void;
  onToggleBargeBoard: (deploy: boolean) => void;
  onChangeChargeLimit: (limit: number) => void;
  onChangeExteriorLights: (lights: ExteriorLightsState) => void;
  onToggleWindTunnel: () => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
}

export default function VehicleOverlays({
  state,
  onSelectDynamicsPreset,
  onEnterTrackMode,
  onChangeAcceleration,
  onChangeRideHandling,
  onChangeFrontWing,
  onChangeRearWing,
  onChangeSuspension,
  onToggleHoodVent,
  onToggleBargeBoard,
  onChangeChargeLimit,
  onChangeExteriorLights,
  onToggleWindTunnel,
  onCameraPresetChange,
}: VehicleOverlaysProps) {
  if (state.primaryTab !== 'Vehicle' || state.trackModeView !== 'Off') {
    return null;
  }

  // 1. VEHICLE -> CHARGING VIEW (matches ui_3.jpg / sec_23.jpg)
  if (state.vehicleSubTab === 'Charging') {
    const limitLeftPct = Math.max(20, Math.min(100, state.chargeLimitPct));
    const fillLeftPct = Math.min(state.batteryPct, limitLeftPct);

    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-28 items-center z-20">
        <div className="pointer-events-auto w-[54%] max-w-[740px]">
          <div className="relative flex items-center justify-between text-xs text-[#ff1a1a] mb-2 font-medium">
            <span>Charge Limit</span>
            <span
              style={{left: `${limitLeftPct}%`}}
              className="absolute -translate-x-1/2 -top-1 text-[#ff1a1a] font-mono tabular-nums text-xs"
            >
              {state.chargeLimitPct}%
            </span>
          </div>

          {/* Green Charge Bar with Right-Half Major/Minor Tick Marks (50%..100%) and Red Diamond Limit Line */}
          <div className="relative h-12 bg-[#0b0d0c]/90 border border-[#ff1a1a]/25 overflow-visible flex items-center">
            {/* Green State-of-Charge Fill */}
            <div
              style={{width: `${fillLeftPct}%`}}
              className="h-full bg-[#36b657] transition-all duration-200"
            />

            {/* Right-Half Tick Marks (50% to 100%, major ticks every 10% + 4 minor ticks between) */}
            <div className="absolute inset-y-0 left-1/2 right-0 flex items-center justify-between px-[2%] pointer-events-none">
              {Array.from({length: 26}).map((_, idx) => {
                const isMajor = idx % 5 === 0;
                return (
                  <div
                    key={idx}
                    className={
                      isMajor
                        ? 'h-5 w-[1.5px] bg-[#ff1a1a]/65'
                        : 'h-2.5 w-[1px] bg-[#ff1a1a]/30'
                    }
                  />
                );
              })}
            </div>

            {/* Vertical Red Charge Limit Bar with Top Diamond (◆) */}
            <div
              style={{left: `${limitLeftPct}%`}}
              className="absolute -top-2 -bottom-1.5 w-[2px] bg-[#ff1a1a] shadow-[0_0_10px_#ff1a1a] pointer-events-none"
            >
              <div className="w-2 h-2 bg-[#ff1a1a] rotate-45 -translate-x-[3px] -translate-y-1.5 shadow-[0_0_6px_#ff1a1a]" />
            </div>

            {/* Interactive Range Input Overlay for setting Charge Limit */}
            <input
              type="range"
              aria-label="Set Charge Limit Percentage"
              min={50}
              max={100}
              step={5}
              value={state.chargeLimitPct}
              onChange={(e) => onChangeChargeLimit(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. VEHICLE -> LIGHTS VIEW
  if (state.vehicleSubTab === 'Lights') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center pl-24 z-20">
        <div className="pointer-events-auto w-[420px] flex flex-col gap-3">
          <div className="bg-[#240303]/85 border border-[#ff1a1a]/30 px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[#ff1a1a] font-medium">Exterior Lights</span>
            <div className="flex items-center gap-1.5">
              {(['Off', 'Daytime Running Light', 'On', 'Auto'] as ExteriorLightsState[]).map(
                (m) => {
                  const active = state.exteriorLights === m;
                  const shortLabel = m === 'Daytime Running Light' ? 'DRL' : m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeExteriorLights(m)}
                      className={`px-3 py-1.5 text-xs transition-all border ${
                        active
                          ? 'border-[#ff1a1a] bg-[#3d0606] text-[#ff1a1a] font-semibold'
                          : 'border-transparent text-[#8c1414] hover:text-[#ff1a1a]'
                      }`}
                    >
                      {shortLabel}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="bg-[#240303]/85 border border-[#ff1a1a]/30 px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[#ff1a1a] font-medium">Aero Streamlines</span>
            <button
              type="button"
              onClick={onToggleWindTunnel}
              className={`px-4 py-1.5 text-xs border ${
                state.windTunnelActive
                  ? 'border-[#ff1a1a] bg-[#3d0606] text-[#ff1a1a] font-semibold'
                  : 'border-[#ff1a1a]/30 text-[#a11b1b]'
              }`}
            >
              {state.windTunnelActive ? 'Active' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. VEHICLE -> DISPLAY VIEW
  if (state.vehicleSubTab === 'Display') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center pl-24 z-20">
        <div className="pointer-events-auto w-[440px] flex flex-col gap-3">
          <div className="bg-[#240303]/85 border border-[#ff1a1a]/30 px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[#ff1a1a] font-medium">Cockpit Camera Angle</span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  {id: 'rearDynamicsXray', label: 'Rear X-Ray'},
                  {id: 'frontDynamicsXray', label: 'Front X-Ray'},
                  {id: 'sideAero', label: 'Side Profile'},
                ] as {id: CameraPreset; label: string}[]
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCameraPresetChange(c.id)}
                  className={`px-3 py-1.5 text-xs border ${
                    state.cameraPreset === c.id
                      ? 'border-[#ff1a1a] bg-[#3d0606] text-[#ff1a1a] font-semibold'
                      : 'border-transparent text-[#8c1414] hover:text-[#ff1a1a]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#240303]/85 border border-[#ff1a1a]/30 px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[#ff1a1a] font-medium">Theme Appearance</span>
            <span className="text-xs text-[#ff1a1a] font-semibold px-3 py-1.5 border border-[#ff1a1a] bg-[#3d0606]">
              Fighter Cockpit Crimson
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. VEHICLE -> DYNAMICS VIEW (matches ui_5.jpg, sec_27.jpg, sec_31.jpg, sec_33.jpg)
  const presets: DynamicsPreset[] = ['Comfort', 'Balance', 'Sport', 'Custom'];

  return (
    <div className="absolute inset-0 pointer-events-none flex items-start pt-20 pl-24 z-20">
      {/* Left Preset Selector Column */}
      <div className="pointer-events-auto flex flex-col gap-3 w-[148px]">
        {presets.map((preset) => {
          const isActive = state.dynamicsPreset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onSelectDynamicsPreset(preset)}
              className={`h-[68px] px-4 flex flex-col justify-center text-left transition-all border ${
                isActive
                  ? 'bg-[#3d0606]/90 border-[#ff1a1a] shadow-[0_0_20px_rgba(255,26,26,0.3)]'
                  : 'bg-[#210303]/80 border-[#ff1a1a]/20 hover:border-[#ff1a1a]/50'
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-widest mb-1 font-mono ${
                  isActive ? 'text-[#ff1a1a]' : 'text-[#8c1414]'
                }`}
              >
                {isActive ? 'ACTIVE' : 'SELECT'}
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-[#ff1a1a]' : 'text-[#a31919]'
                }`}
              >
                {preset}
              </span>
            </button>
          );
        })}

        {/* Track Mode Launch Card */}
        <button
          type="button"
          onClick={onEnterTrackMode}
          className="h-[68px] mt-1 px-4 flex flex-col justify-center text-left bg-[#210303]/85 border border-[#ff1a1a]/25 hover:border-[#ff1a1a] transition-all group"
        >
          <Flag className="w-3.5 h-3.5 text-[#ff1a1a] mb-1.5" />
          <span className="text-xs font-medium text-[#ff1a1a]">Track Mode</span>
        </button>
      </div>

      {/* Middle Dynamics Configuration Panel */}
      {state.dynamicsPreset !== 'Custom' ? (
        /* Summary Rows when Comfort / Balance / Sport is selected (matches ui_5.jpg) */
        <div className="pointer-events-auto ml-12 mt-36 w-[320px] flex flex-col">
          <div className="flex items-center justify-between py-3.5 border-t border-b border-[#ff1a1a]/25 text-xs">
            <span className="text-[#ff1a1a]">Acceleration</span>
            <span className="text-[#ff1a1a] font-medium">{state.accelerationMode}</span>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-[#ff1a1a]/25 text-xs">
            <span className="text-[#ff1a1a]">Ride &amp; Handling</span>
            <span className="text-[#ff1a1a] font-medium">{state.rideHandlingMode}</span>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-[#ff1a1a]/25 text-xs">
            <span className="text-[#ff1a1a]">Ride Height</span>
            <span className="text-[#ff1a1a] font-medium">{state.suspensionMode}</span>
          </div>

          {/* X-Ray Camera Toggle (Front Suspension X-Ray vs Rear COPV & 8 Thrusters X-Ray) */}
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCameraPresetChange('frontDynamicsXray')}
              className={`px-3 py-1.5 text-[11px] border transition-colors ${
                state.cameraPreset === 'frontDynamicsXray'
                  ? 'border-[#ff1a1a] bg-[#3d0606] text-[#ff1a1a]'
                  : 'border-[#ff1a1a]/25 bg-[#1c0303]/80 text-[#991b1b] hover:text-[#ff1a1a]'
              }`}
            >
              Front X-Ray View
            </button>
            <button
              type="button"
              onClick={() => onCameraPresetChange('rearDynamicsXray')}
              className={`px-3 py-1.5 text-[11px] border transition-colors ${
                state.cameraPreset === 'rearDynamicsXray'
                  ? 'border-[#ff1a1a] bg-[#3d0606] text-[#ff1a1a]'
                  : 'border-[#ff1a1a]/25 bg-[#1c0303]/80 text-[#991b1b] hover:text-[#ff1a1a]'
              }`}
            >
              Rear COPV &amp; Thrusters
            </button>
          </div>
        </div>
      ) : (
        /* Full Custom Interactive Matrix (matches sec_31.jpg & sec_33.jpg) */
        <div className="pointer-events-auto ml-5 -mt-4 w-[455px] flex flex-col gap-2.5">
          {/* Row 1: Acceleration */}
          <div className="h-[62px] bg-[#210303]/85 border border-[#ff1a1a]/30 px-4 flex items-center justify-between">
            <span className="text-xs text-[#ff1a1a] font-medium">Acceleration</span>
            <div className="flex items-center gap-2">
              {(['Chill', 'Standard', 'Sport'] as const).map((mode) => {
                const active = state.accelerationMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeAcceleration(mode)}
                    className={`px-3.5 py-2 text-xs transition-all border ${
                      active
                        ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                        : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Ride & Handling */}
          <div className="h-[62px] bg-[#210303]/85 border border-[#ff1a1a]/30 px-4 flex items-center justify-between">
            <span className="text-xs text-[#ff1a1a] font-medium">Ride &amp; Handling</span>
            <div className="flex items-center gap-2">
              {(['Comfort', 'Balance', 'Sport'] as const).map((mode) => {
                const active = state.rideHandlingMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeRideHandling(mode)}
                    className={`px-3.5 py-2 text-xs transition-all border ${
                      active
                        ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                        : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Front Wing */}
          <div className="h-[62px] bg-[#210303]/85 border border-[#ff1a1a]/30 px-4 flex items-center justify-between">
            <span className="text-xs text-[#ff1a1a] font-medium">Front Wing</span>
            <div className="flex items-center gap-2">
              {(['Low Drag', 'High Downforce'] as FrontWingState[]).map((mode) => {
                const active = state.frontWing === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeFrontWing(mode)}
                    className={`px-3.5 py-2 text-xs transition-all border ${
                      active
                        ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                        : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Rear Wing (animates 3D Roadster Wing immediately) */}
          <div className="h-[62px] bg-[#210303]/85 border border-[#ff1a1a]/30 px-4 flex items-center justify-between">
            <span className="text-xs text-[#ff1a1a] font-medium">Rear Wing</span>
            <div className="flex items-center gap-2">
              {(['Stowed', 'Low Drag', 'High Downforce'] as RearWingState[]).map((mode) => {
                const active = state.rearWing === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeRearWing(mode)}
                    className={`px-3.5 py-2 text-xs transition-all border ${
                      active
                        ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                        : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Suspension (animates 3D Roadster Ride Height immediately) */}
          <div className="h-[62px] bg-[#210303]/85 border border-[#ff1a1a]/30 px-4 flex items-center justify-between">
            <span className="text-xs text-[#ff1a1a] font-medium">Suspension</span>
            <div className="flex items-center gap-2">
              {(['Standard', 'Low'] as const).map((mode) => {
                const active = state.suspensionMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeSuspension(mode)}
                    className={`px-3.5 py-2 text-xs transition-all border ${
                      active
                        ? 'border-[#ff1a1a] bg-[#3b0606] text-[#ff1a1a] font-medium'
                        : 'border-transparent text-[#801313] hover:text-[#ff1a1a]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 6: Vent Hood & Barge Board Bottom Split Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onToggleHoodVent(!state.hoodVentOpen)}
              className="h-[62px] bg-[#2b0404]/90 border border-[#ff1a1a] px-4 flex items-center justify-between shadow-[0_0_15px_rgba(255,26,26,0.22)]"
            >
              <span className="text-xs text-[#ff1a1a] font-medium">Vent Hood</span>
              <span className="text-xs text-[#ff1a1a]">
                {state.hoodVentOpen ? 'Open' : 'Close'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onToggleBargeBoard(!state.bargeBoardDeployed)}
              className="h-[62px] bg-[#2b0404]/90 border border-[#ff1a1a] px-4 flex items-center justify-between shadow-[0_0_15px_rgba(255,26,26,0.22)]"
            >
              <span className="text-xs text-[#ff1a1a] font-medium">Barge Board</span>
              <span className="text-xs text-[#ff1a1a]">
                {state.bargeBoardDeployed ? 'Deploy' : 'Retract'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

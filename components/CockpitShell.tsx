'use client';

import React, {useEffect, useRef, useState} from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  VolumeX,
  Film,
  Eye,
  Flame,
  Wind,
  Box,
  Layers,
} from 'lucide-react';
import RoadsterCanvas3D from '@/components/RoadsterCanvas3D';
import VehicleOverlays from '@/components/VehicleOverlays';
import TrackModeConsole from '@/components/TrackModeConsole';
import ListenAndAuxiliaryViews from '@/components/ListenAndAuxiliaryViews';
import {
  AeroLoadState,
  AlbumItem,
  CameraPreset,
  CockpitState,
  DynamicsPreset,
  ExteriorLightsState,
  FanModeState,
  FrontWingState,
  GearState,
  HotspotPopupId,
  INITIAL_COCKPIT_STATE,
  PrimaryNavTab,
  RearWingState,
  TrackAeroProfile,
  TrackItem,
  VehicleSubTab,
  formatMediaTime,
  formatTrackTimer,
  getCockpitStateAtTime,
  getReferenceFramePath,
  stepThrusterBoost,
} from '@/lib/roadster-state';

export interface CarAnimationFrameMeta {
  sec: number;
  timeSec: number;
  cropUrl: string;
  fullUrl: string;
  title: string;
  detail: string;
}

export const CAR_ANIMATION_KEYFRAMES: CarAnimationFrameMeta[] = [
  {
    sec: 1,
    timeSec: 0.4,
    cropUrl: '/assets/roadster/frames/car_crops/sec_01_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_01.jpg',
    title: '01s · Side Wind Tunnel',
    detail: 'Side profile + 7 red diamond hotspots + CFD streamlines',
  },
  {
    sec: 2,
    timeSec: 1.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_02_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_02.jpg',
    title: '02s · Rear 3/4 CFD Orbit',
    detail: 'Camera orbits to rear 3/4 with overhead aero ribbons',
  },
  {
    sec: 3,
    timeSec: 2.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_03_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_03.jpg',
    title: '03s · Rear Wing Stowed',
    detail: 'Rear Wing hotspot opens · Wing flush in deck',
  },
  {
    sec: 4,
    timeSec: 3.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_04_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_04.jpg',
    title: '04s · Rear Wing High Downforce',
    detail: 'Dual pylons extend + crimson quad-mesh airfoil pitches up',
  },
  {
    sec: 5,
    timeSec: 4.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_05_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_05.jpg',
    title: '05s · Rear Wing Low Drag',
    detail: 'Airfoil levels to Low Drag trim angle',
  },
  {
    sec: 6,
    timeSec: 5.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_06_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_06.jpg',
    title: '06s · Barge Board Retract',
    detail: 'Camera orbits to front-left fender · Louvers closed',
  },
  {
    sec: 7,
    timeSec: 6.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_07_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_07.jpg',
    title: '07s · Barge Board Deploy',
    detail: 'Crimson quad-wireframe fender louver grid deploys',
  },
  {
    sec: 8,
    timeSec: 7.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_08_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_08.jpg',
    title: '08s · Hood Vent Close',
    detail: 'Camera pivots to nose · Frunk aero vent closed',
  },
  {
    sec: 9,
    timeSec: 8.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_09_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_09.jpg',
    title: '09s · Hood Vent Open',
    detail: 'Recessed crimson quad-mesh hood intake opens',
  },
  {
    sec: 10,
    timeSec: 9.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_10_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_10.jpg',
    title: '10s · Exterior Lights On',
    detail: 'Upper corner slit projectors + DRL bar + ground cones',
  },
  {
    sec: 11,
    timeSec: 10.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_11_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_11.jpg',
    title: '11s · Daytime Running Light',
    detail: 'Upper slits off · Lower full-width DRL strip stays bright',
  },
  {
    sec: 12,
    timeSec: 11.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_12_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_12.jpg',
    title: '12s · Exterior Lights Auto',
    detail: 'Upper slit projectors + volumetric ground cones re-engage',
  },
  {
    sec: 23,
    timeSec: 22.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_23_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_23.jpg',
    title: '23s · Charging X-Ray Profile',
    detail: 'Right-facing side profile with golden HV pack & front electronics',
  },
  {
    sec: 24,
    timeSec: 23.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_24_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_24.jpg',
    title: '24s · Listen Silhouette',
    detail: 'Dark crimson rear 3/4 silhouette in Listen view',
  },
  {
    sec: 28,
    timeSec: 27.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_28_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_28.jpg',
    title: '28s · Dynamics Comfort X-Ray',
    detail: 'Golden COPV sphere + suspension coilovers + brake discs',
  },
  {
    sec: 29,
    timeSec: 28.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_29_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_29.jpg',
    title: '29s · Dynamics Balance X-Ray',
    detail: 'Balance preset with golden internal chassis cutaway',
  },
  {
    sec: 30,
    timeSec: 29.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_30_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_30.jpg',
    title: '30s · Dynamics Custom Matrix',
    detail: 'Camera shifts right for Custom 6-row dynamics matrix',
  },
  {
    sec: 31,
    timeSec: 30.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_31_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_31.jpg',
    title: '31s · Custom Wing Stowed',
    detail: 'Rear Wing stowed + Standard ride height in X-Ray',
  },
  {
    sec: 32,
    timeSec: 31.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_32_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_32.jpg',
    title: '32s · Custom High Downforce',
    detail: 'Rear Wing deploys to High Downforce over golden COPV',
  },
  {
    sec: 33,
    timeSec: 32.5,
    cropUrl: '/assets/roadster/frames/car_crops/sec_33_car.jpg',
    fullUrl: '/assets/roadster/frames/sec_33.jpg',
    title: '33s · Custom Low Drag + Low Ride',
    detail: 'Rear Wing settles to Low Drag + Suspension lowers to Low',
  },
];

export default function CockpitShell() {
  const [state, setState] = useState<CockpitState>(INITIAL_COCKPIT_STATE);
  const [showcasePlaying, setShowcasePlaying] = useState<boolean>(false);
  const [showcaseTimeSec, setShowcaseTimeSec] = useState<number>(0);
  const [showReferenceOverlay, setShowReferenceOverlay] = useState<boolean>(false);
  const [referenceOpacity, setReferenceOpacity] = useState<number>(0.55);
  const [showCarFramesDrawer, setShowCarFramesDrawer] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const showcaseRafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Support ?wireframe=studio or ?mode=5 query param and keyboard shortcut '5' for 1:1 Studio Quad-Wireframe (Mode 5)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('wireframe') === 'studio' || params.get('mode') === '5') {
      setState((prev) => ({
        ...prev,
        wireframeRenderMode: 'studio',
        cameraPreset: 'studioFrontLeft34',
        activeHotspot: 'none',
        windTunnelActive: false,
        rearWing: 'Stowed',
        frontWing: 'Low Drag',
        bargeBoardDeployed: false,
        hoodVentOpen: false,
        suspensionMode: 'Standard',
      }));
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '5' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setState((prev) => {
          const nextMode = prev.wireframeRenderMode === 'studio' ? 'cockpit' : 'studio';
          if (nextMode === 'studio') {
            return {
              ...prev,
              wireframeRenderMode: 'studio',
              cameraPreset: 'studioFrontLeft34',
              activeHotspot: 'none',
              windTunnelActive: false,
              rearWing: 'Stowed',
              frontWing: 'Low Drag',
              bargeBoardDeployed: false,
              hoodVentOpen: false,
              suspensionMode: 'Standard',
            };
          }
          return {
            ...prev,
            wireframeRenderMode: 'cockpit',
            cameraPreset: 'rearWing34',
            activeHotspot: 'rearWing',
            rearWing: 'Low Drag',
            bargeBoardDeployed: true,
            suspensionMode: 'Low',
          };
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Live telemetry & thruster simulation loop when in interactive mode
  useEffect(() => {
    if (showcasePlaying) return;

    const interval = window.setInterval(() => {
      setState((prev) => {
        const dt = 0.1;
        const nextThruster = stepThrusterBoost(prev.thrusterPsi, prev.boostFiring, dt);
        const nextMediaElapsed = prev.isPlayingMedia
          ? (prev.mediaElapsedSec + dt) % Math.max(1, prev.mediaDurationSec)
          : prev.mediaElapsedSec;

        if (prev.trackModeView !== 'Off') {
          const nextLapElapsed = prev.lapElapsedSec + dt;
          const nextProgress = (prev.trackProgress + dt * 0.018) % 1;
          const angle = nextProgress * Math.PI * 4;
          const gX = Number((-1.45 * Math.cos(angle)).toFixed(2));
          const gY = Number((0.45 * Math.sin(angle * 1.5)).toFixed(2));

          return {
            ...prev,
            thrusterPsi: nextThruster.psi,
            thrusterPct: nextThruster.pct,
            boostReady: nextThruster.boostReady,
            boostFiring:
              prev.boostFiring && nextThruster.psi > 3900 ? prev.boostFiring : false,
            mediaElapsedSec: nextMediaElapsed,
            lapElapsedSec: nextLapElapsed,
            trackProgress: nextProgress,
            gForceX: gX,
            gForceY: gY,
          };
        }

        return {
          ...prev,
          thrusterPsi: nextThruster.psi,
          thrusterPct: nextThruster.pct,
          boostReady: nextThruster.boostReady,
          boostFiring:
            prev.boostFiring && nextThruster.psi > 3900 ? prev.boostFiring : false,
          mediaElapsedSec: nextMediaElapsed,
        };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [showcasePlaying]);

  // Synchronized 33.56s video showcase replay loop
  useEffect(() => {
    if (!showcasePlaying) {
      if (showcaseRafRef.current !== null) {
        cancelAnimationFrame(showcaseRafRef.current);
      }
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      const audioEl = audioRef.current;
      let nextTime = showcaseTimeSec + dt;
      if (audioEl && !audioEl.paused && Number.isFinite(audioEl.currentTime)) {
        nextTime = audioEl.currentTime;
      }

      if (nextTime >= 33.56) {
        setShowcasePlaying(false);
        setShowcaseTimeSec(0);
        setState(getCockpitStateAtTime(0));
        if (audioEl) {
          audioEl.pause();
          audioEl.currentTime = 0;
        }
        return;
      }

      setShowcaseTimeSec(nextTime);
      setState(getCockpitStateAtTime(nextTime));
      showcaseRafRef.current = requestAnimationFrame(tick);
    };

    showcaseRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (showcaseRafRef.current !== null) {
        cancelAnimationFrame(showcaseRafRef.current);
      }
    };
  }, [showcasePlaying, showcaseTimeSec]);

  const handleToggleShowcaseReplay = () => {
    const audioEl = audioRef.current;
    if (showcasePlaying) {
      setShowcasePlaying(false);
      if (audioEl) audioEl.pause();
    } else {
      const startSec = showcaseTimeSec >= 33.4 ? 0 : showcaseTimeSec;
      setShowcaseTimeSec(startSec);
      setState(getCockpitStateAtTime(startSec));
      setShowcasePlaying(true);
      if (audioEl) {
        audioEl.currentTime = startSec;
        audioEl.play().catch(() => {
          // Autoplay fallback if browser blocks unmuted audio
        });
      }
    }
  };

  const handleScrubShowcase = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(33.56, targetSec));
    setShowcaseTimeSec(clamped);
    setState(getCockpitStateAtTime(clamped));
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  // Interactive handlers (pause showcase replay if user manually interacts)
  const stopShowcaseOnManualAction = () => {
    if (showcasePlaying) {
      setShowcasePlaying(false);
      if (audioRef.current) audioRef.current.pause();
    }
  };

  const handleSelectPrimaryTab = (tab: PrimaryNavTab) => {
    stopShowcaseOnManualAction();
    setState((prev) => {
      let nextCamera = prev.cameraPreset;
      let nextHotspot = prev.activeHotspot;
      if (tab === 'Home') {
        nextCamera = 'rearWing34';
        nextHotspot = 'rearWing';
      } else if (tab === 'Vehicle') {
        nextCamera =
          prev.vehicleSubTab === 'Charging' ? 'sideChargingXray' : 'rearDynamicsXray';
        nextHotspot = 'none';
      } else if (tab === 'Listen') {
        nextCamera = 'listenSilhouette';
        nextHotspot = 'none';
      }
      return {
        ...prev,
        primaryTab: tab,
        trackModeView: 'Off',
        cameraPreset: nextCamera,
        activeHotspot: nextHotspot,
      };
    });
  };

  const handleSelectVehicleSubTab = (subTab: VehicleSubTab) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({
      ...prev,
      primaryTab: 'Vehicle',
      vehicleSubTab: subTab,
      trackModeView: 'Off',
      activeHotspot: 'none',
      cameraPreset:
        subTab === 'Charging'
          ? 'sideChargingXray'
          : subTab === 'Lights'
          ? 'frontLights'
          : 'rearDynamicsXray',
    }));
  };

  const handleSelectHotspot = (hotspot: HotspotPopupId, preset?: CameraPreset) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({
      ...prev,
      activeHotspot: hotspot,
      cameraPreset: preset ?? prev.cameraPreset,
      windTunnelActive: false,
    }));
  };

  const handleChangeRearWing = (rearWing: RearWingState) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({...prev, rearWing}));
  };

  const handleChangeFrontWing = (frontWing: FrontWingState) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({...prev, frontWing}));
  };

  const handleToggleBargeBoard = (bargeBoardDeployed: boolean) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({...prev, bargeBoardDeployed}));
  };

  const handleToggleHoodVent = (hoodVentOpen: boolean) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({...prev, hoodVentOpen}));
  };

  const handleChangeExteriorLights = (exteriorLights: ExteriorLightsState) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({...prev, exteriorLights}));
  };

  const handleToggleWindTunnel = () => {
    stopShowcaseOnManualAction();
    setState((prev) => ({
      ...prev,
      windTunnelActive: !prev.windTunnelActive,
      cameraPreset: !prev.windTunnelActive ? 'sideAero' : 'rearWing34',
      activeHotspot: !prev.windTunnelActive ? 'none' : 'rearWing',
    }));
  };

  const handleCameraPresetChange = (cameraPreset: CameraPreset) => {
    stopShowcaseOnManualAction();
    setState((prev) => ({
      ...prev,
      cameraPreset,
      windTunnelActive: cameraPreset === 'sideAero' || cameraPreset === 'rearAero',
    }));
  };

  const handleSelectDynamicsPreset = (dynamicsPreset: DynamicsPreset) => {
    stopShowcaseOnManualAction();
    setState((prev) => {
      if (dynamicsPreset === 'Comfort') {
        return {
          ...prev,
          dynamicsPreset,
          accelerationMode: 'Chill',
          rideHandlingMode: 'Comfort',
          suspensionMode: 'Standard',
          rearWing: 'Stowed',
          frontWing: 'Low Drag',
        };
      }
      if (dynamicsPreset === 'Balance') {
        return {
          ...prev,
          dynamicsPreset,
          accelerationMode: 'Standard',
          rideHandlingMode: 'Balance',
          suspensionMode: 'Standard',
          rearWing: 'Low Drag',
          frontWing: 'Low Drag',
        };
      }
      if (dynamicsPreset === 'Sport') {
        return {
          ...prev,
          dynamicsPreset,
          accelerationMode: 'Sport',
          rideHandlingMode: 'Sport',
          suspensionMode: 'Low',
          rearWing: 'Low Drag',
          frontWing: 'High Downforce',
        };
      }
      return {
        ...prev,
        dynamicsPreset: 'Custom',
      };
    });
  };

  const handleSelectTrackProfile = (trackAeroProfile: TrackAeroProfile) => {
    stopShowcaseOnManualAction();
    setState((prev) => {
      if (trackAeroProfile === 'Low Drag') {
        return {
          ...prev,
          trackAeroProfile,
          frontWing: 'Low Drag',
          rearWing: 'Low Drag',
          aeroLoad: 'Low Drag',
          fanMode: 'Low Drag',
        };
      }
      if (trackAeroProfile === 'High Downforce') {
        return {
          ...prev,
          trackAeroProfile,
          frontWing: 'High Downforce',
          rearWing: 'High Downforce',
          aeroLoad: 'Max Grip',
          fanMode: 'Max Grip',
        };
      }
      return {
        ...prev,
        trackAeroProfile,
      };
    });
  };

  const handleTriggerBoost = () => {
    stopShowcaseOnManualAction();
    setState((prev) => ({
      ...prev,
      boostFiring: !prev.boostFiring,
    }));
  };

  const handleToggleWireframeMode = () => {
    stopShowcaseOnManualAction();
    setState((prev) => {
      const nextMode = prev.wireframeRenderMode === 'studio' ? 'cockpit' : 'studio';
      if (nextMode === 'studio') {
        return {
          ...prev,
          wireframeRenderMode: 'studio',
          cameraPreset: 'studioFrontLeft34',
          activeHotspot: 'none',
          windTunnelActive: false,
          rearWing: 'Stowed',
          frontWing: 'Low Drag',
          bargeBoardDeployed: false,
          hoodVentOpen: false,
          suspensionMode: 'Standard',
        };
      }
      return {
        ...prev,
        wireframeRenderMode: 'cockpit',
        cameraPreset: 'rearWing34',
        activeHotspot: 'rearWing',
        rearWing: 'Low Drag',
        bargeBoardDeployed: true,
        suspensionMode: 'Low',
      };
    });
  };

  const mediaProgressPct = Math.max(
    0,
    Math.min(100, (state.mediaElapsedSec / Math.max(1, state.mediaDurationSec)) * 100)
  );

  const referenceFrameUrl = getReferenceFramePath(showcaseTimeSec);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#050101] text-[#ff1a1a] select-none flex flex-col justify-between"
      data-testid="roadster-cockpit"
    >
      {/* Hidden original stereo audio track extracted from fdFyXTdJPLA */}
      <audio ref={audioRef} src="/assets/roadster/audio.mp3" preload="auto" />

      {/* 1:1 Reference Video Frame Comparison Overlay (toggleable for frame-accurate inspection) */}
      {showReferenceOverlay && (
        <div
          className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
          style={{opacity: referenceOpacity}}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={referenceFrameUrl}
            alt={`Reference frame at ${showcaseTimeSec.toFixed(1)}s`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Interactive 3D Roadster Stage (always active in Home, Vehicle, Listen, Climate, Navigate) */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          state.trackModeView !== 'Off' ? 'opacity-10 pointer-events-none' : 'opacity-100'
        }`}
      >
        <RoadsterCanvas3D
          state={state}
          onSelectHotspot={handleSelectHotspot}
          onChangeRearWing={handleChangeRearWing}
          onToggleBargeBoard={handleToggleBargeBoard}
          onToggleHoodVent={handleToggleHoodVent}
          onChangeExteriorLights={handleChangeExteriorLights}
          onToggleWindTunnel={handleToggleWindTunnel}
          onCameraPresetChange={handleCameraPresetChange}
          onToggleWireframeMode={handleToggleWireframeMode}
        />
      </div>

      {/* Top Status Bar (1:1 with video header) */}
      <header className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1.5 text-xs tracking-wide">
        {/* Left: PRND + Segmented Battery Bar + Percentage */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-mono font-semibold">
            {(['P', 'R', 'N', 'D'] as GearState[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  stopShowcaseOnManualAction();
                  setState((prev) => ({...prev, gear: g}));
                }}
                className={`transition-colors ${
                  state.gear === g
                    ? 'text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    : 'text-[#991515] hover:text-[#ff1a1a]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <span className="text-[#801313]">·</span>

          {/* Segmented Battery Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[2px]">
              {Array.from({length: 10}).map((_, idx) => {
                const filled = (idx + 1) * 10 <= state.batteryPct + 4;
                return (
                  <span
                    key={idx}
                    className={`w-[2.5px] h-3 rounded-[0.5px] ${
                      filled ? 'bg-[#ff1a1a]' : 'bg-[#3d0909]'
                    }`}
                  />
                );
              })}
            </div>
            <span className="font-mono tabular-nums text-[#ff1a1a] font-medium">
              {state.batteryPct}%
            </span>
          </div>
        </div>

        {/* Center: Track Mode Lap / Timer / Position OR Showcase Timeline Scrubber */}
        {state.trackModeView !== 'Off' ? (
          <div
            className="flex items-center gap-3 font-mono text-sm tracking-wider text-[#ff1a1a]"
            data-testid="track-header-telemetry"
          >
            <span>
              <strong className="font-bold">{state.currentLap}</strong>{' '}
              <span className="text-[#801313]">/ {state.totalLaps}</span>
            </span>
            <span className="text-[#801313]">·</span>
            <span className="tabular-nums font-semibold">
              {formatTrackTimer(state.lapElapsedSec)}
            </span>
            <span className="text-[#801313]">·</span>
            <span>
              <span className="text-[#801313]">POS</span>{' '}
              <strong className="font-bold">{state.racePosition}</strong>
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 bg-[#120303]/90 border border-[#3d0909] px-3 py-1">
            <button
              type="button"
              onClick={handleToggleShowcaseReplay}
              data-testid="showcase-replay-toggle"
              className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium transition-colors ${
                showcasePlaying
                  ? 'bg-[#ff1a1a] text-black font-semibold'
                  : 'text-[#ff1a1a] hover:bg-[#260505]'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>{showcasePlaying ? 'Pause 34s Replay' : '34s Video Replay'}</span>
            </button>

            <input
              type="range"
              min={0}
              max={33.56}
              step={0.1}
              value={showcaseTimeSec}
              onChange={(e) => handleScrubShowcase( parseFloat(e.target.value) )}
              aria-label="Showcase timeline scrubber"
              className="w-28 accent-[#ff1a1a] cursor-pointer h-1 bg-[#2b0606]"
            />

            <span className="font-mono tabular-nums text-[11px] text-[#c72020] w-20 text-right">
              {showcaseTimeSec.toFixed(1)}s / 33.6s
            </span>

            <button
              type="button"
              onClick={() => handleScrubShowcase(showcaseTimeSec - 1)}
              title="Step back 1 second"
              className="px-1 text-[10px] text-[#991515] hover:text-[#ff1a1a] font-mono"
            >
              -1s
            </button>
            <button
              type="button"
              onClick={() => handleScrubShowcase(showcaseTimeSec + 1)}
              title="Step forward 1 second"
              className="px-1 text-[10px] text-[#991515] hover:text-[#ff1a1a] font-mono"
            >
              +1s
            </button>

            <span className="text-[#3d0909]">|</span>

            <button
              type="button"
              onClick={() => setShowReferenceOverlay((v) => !v)}
              data-testid="reference-frame-toggle"
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] transition-colors ${
                showReferenceOverlay
                  ? 'bg-[#ff1a1a] text-black font-semibold'
                  : 'text-[#991515] hover:text-[#ff1a1a]'
              }`}
              title="Overlay extracted 1:1 reference frame from video"
            >
              <Eye className="w-3 h-3" />
              <span>1:1 Frame</span>
            </button>
            {showReferenceOverlay && (
              <input
                type="range"
                min={0.15}
                max={0.95}
                step={0.05}
                value={referenceOpacity}
                onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
                aria-label="Reference overlay opacity"
                className="w-14 accent-[#ff1a1a] cursor-pointer h-1"
              />
            )}

            <span className="text-[#3d0909]">|</span>

            <button
              type="button"
              onClick={() => setShowCarFramesDrawer((v) => !v)}
              data-testid="car-frames-drawer-toggle"
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] transition-colors ${
                showCarFramesDrawer
                  ? 'bg-[#ff1a1a] text-black font-semibold'
                  : 'text-[#991515] hover:text-[#ff1a1a]'
              }`}
              title="Inspect all 20 extracted car animation frames from the video"
            >
              <Layers className="w-3 h-3" />
              <span>Car Frames (20)</span>
            </button>
          </div>
        )}

        {/* Right: Quick Boost / Aero / Wireframe Mode Controls + Timestamp */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleWireframeMode}
            data-testid="toggle-wireframe-mode-btn"
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 text-[11px] border transition-colors ${
              state.wireframeRenderMode === 'studio'
                ? 'border-[#1e293b] bg-[#1e293b] text-white font-semibold'
                : 'border-[#3d0909] text-[#a31919] hover:text-[#ff1a1a]'
            }`}
            title="Switch between Cockpit Dual-Pass and Studio Quad-Wireframe (Mode 5)"
          >
            <Box className="w-3 h-3" />
            <span>
              {state.wireframeRenderMode === 'studio' ? 'Studio Mode 5' : 'Quad Wireframe'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleWindTunnel}
            data-testid="header-wind-tunnel-btn"
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 text-[11px] border transition-colors ${
              state.windTunnelActive
                ? 'border-[#ff1a1a] bg-[#ff1a1a]/20 text-white'
                : 'border-[#3d0909] text-[#a31919] hover:text-[#ff1a1a]'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Aero Flow</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBoost}
            data-testid="header-thruster-boost-btn"
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 text-[11px] border transition-colors ${
              state.boostFiring
                ? 'border-[#ff9900] bg-[#ff3b00]/30 text-white'
                : 'border-[#3d0909] text-[#a31919] hover:text-[#ff1a1a]'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{state.boostFiring ? 'Firing COPV' : 'Thruster Boost'}</span>
          </button>

          <span className="text-[#e02424] font-medium tracking-tight">
            {state.dateTimeStr}
          </span>
        </div>
      </header>

      {/* Extracted Car Animation Keyframe Filmstrip Drawer (20 Video Car Frames) */}
      {showCarFramesDrawer && (
        <section
          className="relative z-40 mx-6 mt-1 bg-[#0b0202]/95 border border-[#ff1a1a]/40 p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.9)]"
          data-testid="car-frames-drawer"
        >
          <div className="flex items-center justify-between mb-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#ff1a1a]">
                Extracted Car Animation Keyframes (20 Video Frames · fdFyXTdJPLA)
              </span>
              <span className="text-[#801313]">
                Click any frame to jump the 3D Roadster &amp; cockpit state to that exact keyframe
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCarFramesDrawer(false)}
              className="text-[#991515] hover:text-[#ff1a1a] px-2 py-0.5 border border-[#3d0909]"
            >
              Close
            </button>
          </div>
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
            {CAR_ANIMATION_KEYFRAMES.map((kf) => {
              const isCurrentSec = Math.floor(showcaseTimeSec) + 1 === kf.sec;
              return (
                <button
                  key={kf.sec}
                  type="button"
                  data-testid={`car-keyframe-btn-${kf.sec}`}
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    handleScrubShowcase(kf.timeSec);
                  }}
                  className={`w-[164px] shrink-0 flex flex-col text-left border transition-all p-1.5 ${
                    isCurrentSec
                      ? 'bg-[#2e0505] border-[#ff1a1a] shadow-[0_0_12px_rgba(255,26,26,0.45)]'
                      : 'bg-[#120202] border-[#ff1a1a]/20 hover:border-[#ff1a1a]/60'
                  }`}
                >
                  <div className="w-full h-[74px] bg-black overflow-hidden border border-[#3d0909] mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={kf.cropUrl}
                      alt={kf.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-[#ff1a1a] truncate">
                    {kf.title}
                  </div>
                  <div className="text-[9px] text-[#991515] leading-tight line-clamp-2 mt-0.5">
                    {kf.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Left Vertical Gear Shifter Strip (1:1 with video left edge: ↑/↓ arrows, 2-column dot matrix, lower pill backing, top-down car icon) */}
      <aside
        className="fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-between h-[420px] w-7 py-3 pointer-events-auto"
        aria-label="Gear shift strip"
      >
        <button
          type="button"
          onClick={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, gear: 'D'}));
          }}
          className="text-[#801313] hover:text-[#ff1a1a] transition-colors p-1"
          title="Shift Drive"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        {/* Vertical 2-column dotted track with subtle lower pill backing and top-down Roadster silhouette */}
        <div className="relative flex-1 flex flex-col items-center justify-between py-2 w-full">
          {/* Subtle lower translucent dark pill backing visible when in Park (sec_06..12, sec_23, sec_28..29) */}
          <div className="absolute inset-x-0.5 bottom-0 top-[44%] rounded-full bg-[#160202]/70 border border-[#ff1a1a]/15 pointer-events-none" />

          {/* 2-Column Red Dot Matrix (2 x 18 dots) */}
          {Array.from({length: 18}).map((_, idx) => (
            <div key={idx} className="relative z-10 flex items-center gap-[4px]">
              <span className="w-[2px] h-[2px] rounded-full bg-[#590d0d]" />
              <span className="w-[2px] h-[2px] rounded-full bg-[#590d0d]" />
            </div>
          ))}

          {/* Top-down red Roadster car shifter icon */}
          <button
            type="button"
            onClick={() => {
              stopShowcaseOnManualAction();
              setState((prev) => ({
                ...prev,
                gear: prev.gear === 'D' ? 'P' : 'D',
              }));
            }}
            style={{
              top:
                state.gear === 'D' && state.windTunnelActive
                  ? '16%'
                  : state.gear === 'D'
                  ? '24%'
                  : state.gear === 'N'
                  ? '42%'
                  : state.gear === 'R'
                  ? '72%'
                  : '48%',
            }}
            className="absolute z-20 -translate-y-1/2 w-5 h-9 flex items-center justify-center transition-all duration-300"
            title={`Current Gear: ${state.gear}`}
          >
            <svg
              viewBox="0 0 24 44"
              className="w-4 h-8 fill-[#ff1a1a] stroke-[#ff4d4d] stroke-[0.8] drop-shadow-[0_0_8px_rgba(255,26,26,0.65)]"
            >
              <path d="M7 3 C9 1, 15 1, 17 3 L20 11 L20 35 C20 39, 17 42, 12 42 C7 42, 4 39, 4 35 L4 11 Z" />
              <path d="M7 13 L17 13 L16 26 L8 26 Z" fill="#2b0404" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, gear: 'R'}));
          }}
          className="text-[#801313] hover:text-[#ff1a1a] transition-colors p-1"
          title="Shift Reverse"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </aside>

      {/* Main Middle View Overlays (Vehicle Overlays, Track Mode Console, Listen & Auxiliary) */}
      <div className="relative flex-1 w-full">
        <VehicleOverlays
          state={state}
          onSelectDynamicsPreset={handleSelectDynamicsPreset}
          onEnterTrackMode={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              primaryTab: 'Vehicle',
              trackModeView: 'Dashboard',
            }));
          }}
          onChangeAcceleration={(accelerationMode) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              dynamicsPreset: 'Custom',
              accelerationMode,
            }));
          }}
          onChangeRideHandling={(rideHandlingMode) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              dynamicsPreset: 'Custom',
              rideHandlingMode,
            }));
          }}
          onChangeFrontWing={handleChangeFrontWing}
          onChangeRearWing={handleChangeRearWing}
          onChangeSuspension={(suspensionMode) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, suspensionMode}));
          }}
          onToggleHoodVent={handleToggleHoodVent}
          onToggleBargeBoard={handleToggleBargeBoard}
          onChangeChargeLimit={(chargeLimitPct) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, chargeLimitPct}));
          }}
          onChangeExteriorLights={handleChangeExteriorLights}
          onToggleWindTunnel={handleToggleWindTunnel}
          onCameraPresetChange={handleCameraPresetChange}
        />

        <TrackModeConsole
          state={state}
          onToggleTrackSubView={(trackModeView) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, trackModeView}));
          }}
          onExitTrackMode={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              trackModeView: 'Off',
              primaryTab: 'Vehicle',
              vehicleSubTab: 'Dynamics',
              cameraPreset: 'rearDynamicsXray',
            }));
          }}
          onSelectTrackProfile={handleSelectTrackProfile}
          onChangeFrontWing={(frontWing) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              trackAeroProfile: 'Custom',
              frontWing,
            }));
          }}
          onChangeRearWing={(rearWing) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              trackAeroProfile: 'Custom',
              rearWing,
            }));
          }}
          onChangeAeroLoad={(aeroLoad: AeroLoadState) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              trackAeroProfile: 'Custom',
              aeroLoad,
            }));
          }}
          onChangeFanMode={(fanMode: FanModeState) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              trackAeroProfile: 'Custom',
              fanMode,
            }));
          }}
          onChangeAeroBalance={(aeroBalanceStep) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              aeroBalanceStep: Math.max(-3, Math.min(3, aeroBalanceStep)),
            }));
          }}
          onChangeBrakeBalance={(brakeBalanceStep) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              brakeBalanceStep: Math.max(-3, Math.min(3, brakeBalanceStep)),
            }));
          }}
          onToggleHoodVent={handleToggleHoodVent}
          onToggleBargeBoard={handleToggleBargeBoard}
          onToggleEsc={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, escEnabled: !prev.escEnabled}));
          }}
          onToggleTcs={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, tcsEnabled: !prev.tcsEnabled}));
          }}
          onTriggerBoost={handleTriggerBoost}
        />

        <ListenAndAuxiliaryViews
          state={state}
          onSelectListenSubView={(listenSubView) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({...prev, listenSubView}));
          }}
          onSelectAlbum={(album: AlbumItem) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              activeTrackTitle: album.title,
              activeTrackArtist: album.artist,
              activeTrackCover: album.coverUrl,
              mediaElapsedSec: album.currentSec,
              mediaDurationSec: album.durationSec,
              isPlayingMedia: true,
            }));
          }}
          onSelectTrack={(track: TrackItem) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              activeTrackTitle: track.title,
              activeTrackArtist: 'Horizon One',
              activeTrackCover: '/assets/roadster/albums/to_the_stars.jpg',
              mediaElapsedSec: 0,
              mediaDurationSec: track.durationSec,
              isPlayingMedia: true,
            }));
          }}
          onChangeCabinTemp={(cabinTempF) => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              cabinTempF: Math.max(58, Math.min(84, cabinTempF)),
            }));
          }}
          onEnterTrackMode={() => {
            stopShowcaseOnManualAction();
            setState((prev) => ({
              ...prev,
              primaryTab: 'Vehicle',
              trackModeView: 'Dashboard',
            }));
          }}
        />
      </div>

      {/* Bottom Media & Primary Navigation Dock (hidden during fullscreen Track Mode) */}
      {state.trackModeView === 'Off' && (
        <footer className="relative z-30 w-full px-6 pb-3 pt-1 bg-gradient-to-t from-[#050101] via-[#050101]/95 to-transparent">
          <div className="grid grid-cols-12 items-end gap-5">
            {/* LEFT COLUMN (Cols 1-2): Hairline + Cabin Temp (< 68 >) */}
            <div className="col-span-2 flex flex-col">
              <div className="h-9" />
              <div className="w-full h-[1px] bg-[#4a0b0b]" />
              <div className="flex items-center justify-center gap-6 pt-2.5 text-[#ff1a1a]">
                <button
                  type="button"
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    setState((prev) => ({
                      ...prev,
                      cabinTempF: Math.max(58, prev.cabinTempF - 1),
                    }));
                  }}
                  className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                  aria-label="Decrease cabin temperature"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono tabular-nums text-lg font-medium w-8 text-center tracking-wider">
                  {state.cabinTempF}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    setState((prev) => ({
                      ...prev,
                      cabinTempF: Math.min(84, prev.cabinTempF + 1),
                    }));
                  }}
                  className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                  aria-label="Increase cabin temperature"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CENTER COLUMN (Cols 3-10): Media Bar or Vehicle Sub-Tabs + Primary Nav */}
            <div className="col-span-8 flex flex-col">
              {state.primaryTab === 'Vehicle' ? (
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center justify-center gap-20 pb-2 text-xs">
                    {(['Dynamics', 'Lights', 'Display', 'Charging'] as VehicleSubTab[]).map(
                      (sub) => {
                        const active = state.vehicleSubTab === sub;
                        return (
                          <button
                            key={sub}
                            type="button"
                            data-testid={`vehicle-subtab-${sub.toLowerCase()}`}
                            onClick={() => handleSelectVehicleSubTab(sub)}
                            className={`relative transition-colors ${
                              active
                                ? 'text-[#ff1a1a] font-medium'
                                : 'text-[#801313] hover:text-[#c72020]'
                            }`}
                          >
                            <span>{sub}</span>
                            {/* Hollow upward caret notch (/\) integrated into the baseline */}
                            {active && (
                              <span className="absolute left-1/2 -translate-x-1/2 -bottom-[11px] w-2.5 h-2.5 bg-[#050101] border-t border-l border-[#ff1a1a] rotate-45 z-10" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                  <div className="w-full h-[1px] bg-[#6b1111]" />
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between pb-1.5">
                    {/* Left: Album Art + Track Title & Artist */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <div className="w-7 h-7 overflow-hidden border border-[#4a0b0b] bg-[#140303] shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={state.activeTrackCover}
                          alt={state.activeTrackTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-medium text-[#ff1a1a]">
                          {state.activeTrackTitle}
                        </div>
                        <div className="text-[11px] text-[#801313]">
                          {state.activeTrackArtist}
                        </div>
                      </div>
                    </div>

                    {/* Center: 5-Icon Transport Controls (Shuffle | SkipBack | Pause/Play | SkipForward | Repeat) */}
                    <div className="flex items-center gap-6 text-[#ff1a1a]">
                      <button
                        type="button"
                        onClick={stopShowcaseOnManualAction}
                        className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                        aria-label="Shuffle"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopShowcaseOnManualAction();
                          setState((prev) => ({...prev, mediaElapsedSec: 0}));
                        }}
                        className="text-[#a31919] hover:text-[#ff1a1a] transition-colors"
                        aria-label="Previous Track"
                      >
                        <SkipBack className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopShowcaseOnManualAction();
                          setState((prev) => ({
                            ...prev,
                            isPlayingMedia: !prev.isPlayingMedia,
                          }));
                        }}
                        className="text-[#ff1a1a] hover:text-white transition-colors"
                        aria-label={state.isPlayingMedia ? 'Pause' : 'Play'}
                      >
                        {state.isPlayingMedia ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopShowcaseOnManualAction();
                          setState((prev) => ({
                            ...prev,
                            mediaElapsedSec: 0,
                          }));
                        }}
                        className="text-[#a31919] hover:text-[#ff1a1a] transition-colors"
                        aria-label="Next Track"
                      >
                        <SkipForward className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={stopShowcaseOnManualAction}
                        className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                        aria-label="Repeat"
                      >
                        <Repeat className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Right: Stacked Elapsed / Duration (matches ui_1.jpg) */}
                    <div className="font-mono tabular-nums text-[10px] leading-tight text-right min-w-[80px]">
                      <div className="text-[#ff1a1a] font-medium">
                        {formatMediaTime(state.mediaElapsedSec)}
                      </div>
                      <div className="text-[#801313]">
                        {formatMediaTime(state.mediaDurationSec)}
                      </div>
                    </div>
                  </div>

                  {/* Thin Red Media Scrubber Line with Glowing Red Handle */}
                  <div className="relative w-full h-[1.5px] bg-[#3d0909]">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#ff1a1a] shadow-[0_0_8px_#ff1a1a]"
                      style={{width: `${mediaProgressPct}%`}}
                    />
                    <span
                      style={{left: `${mediaProgressPct}%`}}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ff1a1a] shadow-[0_0_6px_#ff1a1a]"
                    />
                  </div>
                </div>
              )}

              {/* Primary Navigation Tabs */}
              <nav
                className="flex items-center justify-center gap-16 pt-2.5"
                aria-label="Primary cockpit navigation"
              >
                {(['Home', 'Vehicle', 'Listen', 'Climate', 'Navigate'] as PrimaryNavTab[]).map(
                  (tab) => {
                    const active = state.primaryTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        data-testid={`nav-tab-${tab.toLowerCase()}`}
                        onClick={() => handleSelectPrimaryTab(tab)}
                        className={`relative py-0.5 text-xs transition-colors ${
                          active
                            ? 'text-[#ff1a1a] font-medium'
                            : 'text-[#801313] hover:text-[#c72020]'
                        }`}
                      >
                        <span>{tab}</span>
                      </button>
                    );
                  }
                )}
              </nav>
            </div>

            {/* RIGHT COLUMN (Cols 11-12): Mini Transport (in Vehicle mode) + Active Progress Line + Speaker+Equalizer Volume */}
            <div className="col-span-2 flex flex-col">
              {state.primaryTab === 'Vehicle' ? (
                <div className="flex items-center justify-center gap-7 pb-2 text-[#ff1a1a]">
                  <button
                    type="button"
                    onClick={() => {
                      stopShowcaseOnManualAction();
                      setState((prev) => ({...prev, mediaElapsedSec: 0}));
                    }}
                    className="hover:text-white transition-colors"
                    aria-label="Previous Track"
                  >
                    <SkipBack className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopShowcaseOnManualAction();
                      setState((prev) => ({
                        ...prev,
                        isPlayingMedia: !prev.isPlayingMedia,
                      }));
                    }}
                    className="hover:text-white transition-colors"
                    aria-label={state.isPlayingMedia ? 'Pause' : 'Play'}
                  >
                    {state.isPlayingMedia ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopShowcaseOnManualAction();
                      setState((prev) => ({...prev, mediaElapsedSec: 0}));
                    }}
                    className="hover:text-white transition-colors"
                    aria-label="Next Track"
                  >
                    <SkipForward className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ) : (
                <div className="h-9" />
              )}

              {/* Hairline or Active Mini Media Progress Bar in Vehicle Mode */}
              <div className="relative w-full h-[1px] bg-[#4a0b0b]">
                {state.primaryTab === 'Vehicle' && (
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#ff1a1a] shadow-[0_0_6px_#ff1a1a]"
                    style={{width: `${mediaProgressPct}%`}}
                  />
                )}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2.5 text-[#ff1a1a]">
                <button
                  type="button"
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    setState((prev) => ({
                      ...prev,
                      volumeMuted: false,
                      volumeLevel: Math.max(0, prev.volumeLevel - 5),
                    }));
                  }}
                  className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                  aria-label="Volume down"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    setState((prev) => ({...prev, volumeMuted: !prev.volumeMuted}));
                  }}
                  className="text-[#ff1a1a] hover:text-white transition-colors"
                  aria-label={state.volumeMuted ? 'Unmute' : 'Mute'}
                >
                  {state.volumeMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    /* Speaker cone + 3 vertical equalizer bars matching sec_03..sec_33 */
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 fill-none stroke-current"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                      <line x1="15" y1="9" x2="15" y2="15" />
                      <line x1="18.5" y1="6.5" x2="18.5" y2="17.5" />
                      <line x1="22" y1="10" x2="22" y2="14" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopShowcaseOnManualAction();
                    setState((prev) => ({
                      ...prev,
                      volumeMuted: false,
                      volumeLevel: Math.min(100, prev.volumeLevel + 5),
                    }));
                  }}
                  className="text-[#801313] hover:text-[#ff1a1a] transition-colors"
                  aria-label="Volume up"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}

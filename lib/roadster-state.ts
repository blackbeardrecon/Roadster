export type GearState = 'P' | 'R' | 'N' | 'D';
export type PrimaryNavTab = 'Home' | 'Vehicle' | 'Listen' | 'Climate' | 'Navigate';
export type VehicleSubTab = 'Dynamics' | 'Lights' | 'Display' | 'Charging';
export type DynamicsPreset = 'Comfort' | 'Balance' | 'Sport' | 'Custom';
export type TrackModeView = 'Off' | 'Dashboard' | 'Setup';
export type TrackAeroProfile = 'Auto' | 'Low Drag' | 'High Downforce' | 'Custom';
export type RearWingState = 'Stowed' | 'Low Drag' | 'High Downforce';
export type FrontWingState = 'Low Drag' | 'High Downforce';
export type AeroLoadState = 'Low Drag' | 'Balance' | 'Max Grip';
export type FanModeState = 'Off' | 'Braking' | 'Low Drag' | 'Max Grip';
export type ExteriorLightsState = 'Off' | 'Daytime Running Light' | 'On' | 'Auto';
export type HotspotPopupId = 'none' | 'rearWing' | 'bargeBoard' | 'hoodVent' | 'exteriorLights';
export type ListenSubView = 'Overview' | 'AlbumDetail';
export type WireframeRenderMode = 'cockpit' | 'studio';

export type CameraPreset =
  | 'sideAero'
  | 'rearAero'
  | 'rearWing34'
  | 'sideBarge'
  | 'frontHood'
  | 'frontLights'
  | 'sideChargingXray'
  | 'listenSilhouette'
  | 'frontDynamicsXray'
  | 'rearDynamicsXray'
  | 'studioFrontLeft34';

export interface TireTelemetry {
  id: 'FL' | 'FR' | 'RL' | 'RR';
  psi: number;
  tempF: number;
  brakeTempF: number;
}

export interface LapRecord {
  lap: number;
  time: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: string;
  genre: string;
  durationSec: number;
  currentSec: number;
}

export interface TrackItem {
  number: string;
  title: string;
  duration: string;
  durationSec: number;
}

export interface CarAnimationTargets {
  rearWingDeploy: number; // 0 = Stowed, 0.48 = Low Drag, 1.0 = High Downforce
  frontWingDeploy: number; // 0.25 = Low Drag, 1.0 = High Downforce
  bargeBoardDeploy: number; // 0 = Retract, 1 = Deploy
  hoodVentOpen: number; // 0 = Closed, 1 = Open
  rideHeightOffset: number; // 0 = Standard, -0.14 = Low
  headlightIntensity: number; // 0 = Off, 0.35 = DRL, 1.0 = On/Auto
  airflowStreamIntensity: number; // 0..1 white/red wind-tunnel streamlines
  rearRedWakeIntensity: number; // 0..1 crimson aero wake behind wing
  xrayDrivetrainIntensity: number; // 0..1 golden COPV tank, 8 thrusters, suspension
  xrayBatteryIntensity: number; // 0..1 golden structural battery pack + front/rear motor cutaway
  thrusterNozzleGlow: number; // 0..1 golden glow on 8 rear thruster nozzles
  thrusterPlumeIntensity: number; // 0..1 active cold-gas thruster firing plume
  fanSpinIntensity: number; // 0..1 underbody aero fan speed
  wheelSpinSpeed: number; // rad/s
  silhouetteDarkness: number; // 0 = normal wireframe/studio, 1 = dark Listen silhouette
}

export interface CockpitState {
  // Global header
  gear: GearState;
  batteryPct: number;
  dateTimeStr: string;
  cabinTempF: number;
  volumeMuted: boolean;
  volumeLevel: number;

  // Navigation & views
  primaryTab: PrimaryNavTab;
  vehicleSubTab: VehicleSubTab;
  trackModeView: TrackModeView;
  listenSubView: ListenSubView;

  // 3D Camera & Hotspot Popups
  cameraPreset: CameraPreset;
  activeHotspot: HotspotPopupId;
  windTunnelActive: boolean;
  wireframeRenderMode: WireframeRenderMode;

  // Aerodynamics & Vehicle Hardware Controls
  rearWing: RearWingState;
  frontWing: FrontWingState;
  bargeBoardDeployed: boolean;
  hoodVentOpen: boolean;
  exteriorLights: ExteriorLightsState;
  chargeLimitPct: number;

  // Vehicle Dynamics Presets
  dynamicsPreset: DynamicsPreset;
  accelerationMode: 'Chill' | 'Standard' | 'Sport';
  rideHandlingMode: 'Comfort' | 'Balance' | 'Sport';
  suspensionMode: 'Standard' | 'Low';

  // Track Mode & Setup Controls
  trackAeroProfile: TrackAeroProfile;
  aeroLoad: AeroLoadState;
  fanMode: FanModeState;
  aeroBalanceStep: number; // -3 to +3
  brakeBalanceStep: number; // -3 to +3
  escEnabled: boolean;
  tcsEnabled: boolean;

  // Live Track Mode Telemetry
  currentLap: number;
  totalLaps: number;
  lapElapsedSec: number;
  racePosition: number;
  brakePedalPct: number;
  accelPedalPct: number;
  regenPct: number;
  batteryTempF: number;
  motorTempF: number;
  gForceX: number; // Lateral G (-3.5 to +3.5)
  gForceY: number; // Longitudinal G (-3.5 to +3.5)
  elevationFt: number;
  sector1Time: string;
  sector2Time: string;
  sector3Time: string;
  lastLapTime: string;
  bestLapTime: string;
  trackProgress: number; // 0..1 around the circuit
  tires: TireTelemetry[];

  // SpaceX Cold-Gas Thruster Telemetry
  thrusterPsi: number; // Nominal 5500 PSI
  thrusterPct: number; // Nominal 100%
  boostReady: boolean;
  boostFiring: boolean;

  // Media Player
  isPlayingMedia: boolean;
  activeTrackTitle: string;
  activeTrackArtist: string;
  activeTrackCover: string;
  mediaElapsedSec: number;
  mediaDurationSec: number;
}

export const RECENTLY_PLAYED_ALBUMS: AlbumItem[] = [
  {
    id: 'to-the-stars',
    title: 'To The Stars',
    artist: 'Horizon One',
    coverUrl: '/assets/roadster/albums/to_the_stars.jpg',
    year: '2026',
    genre: 'Electronic',
    durationSec: 236,
    currentSec: 134,
  },
  {
    id: 'painted-meridian',
    title: 'Painted Meridian',
    artist: 'Sable Finch',
    coverUrl: '/assets/roadster/albums/painted_meridian.jpg',
    year: '2026',
    genre: 'Ambient',
    durationSec: 218,
    currentSec: 45,
  },
  {
    id: 'soft-visage',
    title: 'Soft Visage',
    artist: 'Juniper Lane',
    coverUrl: '/assets/roadster/albums/soft_visage.jpg',
    year: '2026',
    genre: 'Synthwave',
    durationSec: 244,
    currentSec: 92,
  },
  {
    id: 'linen-hour',
    title: 'Linen Hour',
    artist: 'Hollow Radio',
    coverUrl: '/assets/roadster/albums/linen_hour.jpg',
    year: '2026',
    genre: 'Downtempo',
    durationSec: 176,
    currentSec: 92,
  },
  {
    id: 'slow-mercury',
    title: 'Slow Mercury',
    artist: 'Kite Parish',
    coverUrl: '/assets/roadster/albums/slow_mercury.jpg',
    year: '2026',
    genre: 'Electronic',
    durationSec: 212,
    currentSec: 60,
  },
  {
    id: 'petal-static',
    title: 'Petal Static',
    artist: 'Orchid Glass',
    coverUrl: '/assets/roadster/albums/petal_static.jpg',
    year: '2026',
    genre: 'Experimental',
    durationSec: 198,
    currentSec: 30,
  },
  {
    id: 'window-mileage',
    title: 'Window Mileage',
    artist: 'Low Harbor',
    coverUrl: '/assets/roadster/albums/window_mileage.jpg',
    year: '2026',
    genre: 'Night Drive',
    durationSec: 254,
    currentSec: 110,
  },
  {
    id: 'coral-pressing',
    title: 'Coral Pressing',
    artist: 'Paper Kiln',
    coverUrl: '/assets/roadster/albums/coral_pressing.jpg',
    year: '2026',
    genre: 'Minimal',
    durationSec: 189,
    currentSec: 20,
  },
];

export const MADE_FOR_YOU_ALBUMS: AlbumItem[] = [
  {
    id: 'topographic-echo',
    title: 'Topographic Echo',
    artist: 'Vespera',
    coverUrl: '/assets/roadster/albums/to_the_stars.jpg',
    year: '2026',
    genre: 'Electronic',
    durationSec: 214,
    currentSec: 0,
  },
  {
    id: 'horizon-haze',
    title: 'Horizon Haze',
    artist: 'Lumen Vale',
    coverUrl: '/assets/roadster/albums/linen_hour.jpg',
    year: '2026',
    genre: 'Ambient',
    durationSec: 198,
    currentSec: 0,
  },
  {
    id: 'velvet-orbit',
    title: 'Velvet Orbit',
    artist: 'Sable Finch',
    coverUrl: '/assets/roadster/albums/glass_weather.jpg',
    year: '2026',
    genre: 'Synthwave',
    durationSec: 226,
    currentSec: 0,
  },
  {
    id: 'crimson-telemetry',
    title: 'Crimson Telemetry',
    artist: 'Hollow Radio',
    coverUrl: '/assets/roadster/albums/soft_visage.jpg',
    year: '2026',
    genre: 'Electronic',
    durationSec: 240,
    currentSec: 0,
  },
  {
    id: 'emerald-static',
    title: 'Emerald Static',
    artist: 'Orchid Glass',
    coverUrl: '/assets/roadster/albums/petal_static.jpg',
    year: '2026',
    genre: 'Experimental',
    durationSec: 205,
    currentSec: 0,
  },
  {
    id: 'midnight-apogee',
    title: 'Midnight Apogee',
    artist: 'Kite Parish',
    coverUrl: '/assets/roadster/albums/slow_mercury.jpg',
    year: '2026',
    genre: 'Downtempo',
    durationSec: 232,
    currentSec: 0,
  },
  {
    id: 'suborbital-line',
    title: 'Suborbital Line',
    artist: 'Paper Kiln',
    coverUrl: '/assets/roadster/albums/window_mileage.jpg',
    year: '2026',
    genre: 'Minimal',
    durationSec: 190,
    currentSec: 0,
  },
];

export const TO_THE_STARS_TRACKS: TrackItem[] = [
  {number: '01', title: 'To The Stars', duration: '3:56', durationSec: 236},
  {number: '02', title: 'Passing Kiln', duration: '3:56', durationSec: 236},
  {number: '03', title: 'Acre Light', duration: '3:14', durationSec: 194},
  {number: '04', title: 'Low Lantern', duration: '4:02', durationSec: 242},
  {number: '05', title: 'After the Frame', duration: '3:37', durationSec: 217},
  {number: '06', title: 'Warm Static', duration: '2:48', durationSec: 168},
  {number: '07', title: 'Solar Meridian', duration: '4:48', durationSec: 288},
];

export const SESSION_LAP_HISTORY_LEFT: LapRecord[] = [
  {lap: 23, time: '01:38.902'},
  {lap: 22, time: '01:37.647'},
  {lap: 21, time: '01:39.323'},
  {lap: 20, time: '01:38.420'},
  {lap: 19, time: '01:39.985'},
];

export const SESSION_LAP_HISTORY_RIGHT: LapRecord[] = [
  {lap: 18, time: '01:39.881'},
  {lap: 17, time: '01:42.042'},
  {lap: 16, time: '01:41.259'},
  {lap: 15, time: '01:42.942'},
  {lap: 14, time: '01:42.573'},
];

export const INITIAL_COCKPIT_STATE: CockpitState = {
  gear: 'D',
  batteryPct: 86,
  dateTimeStr: 'Wed Oct 7 · 5:38 PM',
  cabinTempF: 68,
  volumeMuted: false,
  volumeLevel: 72,

  primaryTab: 'Home',
  vehicleSubTab: 'Dynamics',
  trackModeView: 'Off',
  listenSubView: 'Overview',

  cameraPreset: 'rearWing34',
  activeHotspot: 'rearWing',
  windTunnelActive: false,
  wireframeRenderMode: 'cockpit',

  rearWing: 'Low Drag',
  frontWing: 'Low Drag',
  bargeBoardDeployed: true,
  hoodVentOpen: false,
  exteriorLights: 'On',
  chargeLimitPct: 90,

  dynamicsPreset: 'Sport',
  accelerationMode: 'Sport',
  rideHandlingMode: 'Sport',
  suspensionMode: 'Low',

  trackAeroProfile: 'Auto',
  aeroLoad: 'Max Grip',
  fanMode: 'Max Grip',
  aeroBalanceStep: 1,
  brakeBalanceStep: -1,
  escEnabled: false,
  tcsEnabled: false,

  currentLap: 24,
  totalLaps: 60,
  lapElapsedSec: 16.306,
  racePosition: 1,
  brakePedalPct: 15,
  accelPedalPct: 29,
  regenPct: 34,
  batteryTempF: 101,
  motorTempF: 204,
  gForceX: -1.85,
  gForceY: 0.15,
  elevationFt: 90,
  sector1Time: '16.2',
  sector2Time: '--.--',
  sector3Time: '--.--',
  lastLapTime: '01:38.902',
  bestLapTime: '01:37.647',
  trackProgress: 0.42,
  tires: [
    {id: 'FL', psi: 28, tempF: 179, brakeTempF: 946},
    {id: 'FR', psi: 28, tempF: 179, brakeTempF: 946},
    {id: 'RL', psi: 28, tempF: 178, brakeTempF: 677},
    {id: 'RR', psi: 28, tempF: 178, brakeTempF: 677},
  ],

  thrusterPsi: 5500,
  thrusterPct: 100,
  boostReady: true,
  boostFiring: false,

  isPlayingMedia: true,
  activeTrackTitle: 'Glass Weather',
  activeTrackArtist: 'Lumen Vale',
  activeTrackCover: '/assets/roadster/albums/glass_weather.jpg',
  mediaElapsedSec: 146,
  mediaDurationSec: 236,
};

export function formatTrackTimer(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const rem = safe - mins * 60;
  const wholeSecs = Math.floor(rem);
  const millis = Math.round((rem - wholeSecs) * 1000);
  return `${mins}:${String(wholeSecs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function formatMediaTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateBalanceSplit(
  step: number,
  mode: 'aero' | 'brake',
  inSetupScreen = false,
  isCustomSetup = false
): {frontPct: number; rearPct: number; formattedStep: string} {
  const clamped = Math.max(-3, Math.min(3, Math.round(step)));
  const formattedStep = clamped > 0 ? `+${clamped}` : `${clamped}`;
  if (mode === 'aero') {
    if (inSetupScreen && clamped === 1) {
      return isCustomSetup
        ? {frontPct: 50, rearPct: 50, formattedStep}
        : {frontPct: 48, rearPct: 52, formattedStep};
    }
    if (clamped === 1 || clamped === 3) {
      return {frontPct: 44, rearPct: 56, formattedStep};
    }
    if (clamped === -1) {
      return {frontPct: 46, rearPct: 54, formattedStep};
    }
    const frontPct = Math.max(35, Math.min(65, 50 - clamped * 2));
    return {frontPct, rearPct: 100 - frontPct, formattedStep};
  } else {
    if (inSetupScreen && clamped === -1) {
      return {frontPct: 62, rearPct: 38, formattedStep};
    }
    if (clamped === -1) {
      return {frontPct: 57, rearPct: 43, formattedStep};
    }
    if (clamped === 1) {
      return {frontPct: 55, rearPct: 45, formattedStep};
    }
    const frontPct = Math.max(40, Math.min(70, 55 - clamped * 2));
    return {frontPct, rearPct: 100 - frontPct, formattedStep};
  }
}

export function stepThrusterBoost(
  currentPsi: number,
  boostFiring: boolean,
  dtSec: number
): {psi: number; pct: number; boostReady: boolean} {
  const maxPsi = 5500;
  const minPsi = 3850;
  let nextPsi = currentPsi;
  if (boostFiring) {
    nextPsi = Math.max(minPsi, currentPsi - dtSec * 820);
  } else {
    nextPsi = Math.min(maxPsi, currentPsi + dtSec * 460);
  }
  const roundedPsi = Math.round(nextPsi / 5) * 5;
  const pct = Math.max(0, Math.min(100, Math.round((roundedPsi / maxPsi) * 100)));
  return {
    psi: roundedPsi,
    pct,
    boostReady: pct >= 85,
  };
}

export function computeTargetCarAnimations(state: CockpitState): CarAnimationTargets {
  const rearWingDeploy =
    state.rearWing === 'High Downforce'
      ? 1.0
      : state.rearWing === 'Low Drag'
      ? 0.48
      : 0.0;

  const frontWingDeploy = state.frontWing === 'High Downforce' ? 1.0 : 0.25;
  const bargeBoardDeploy = state.bargeBoardDeployed ? 1.0 : 0.0;
  const hoodVentOpen = state.hoodVentOpen ? 1.0 : 0.0;
  const rideHeightOffset = state.suspensionMode === 'Low' ? -0.14 : 0.0;

  const headlightIntensity =
    state.exteriorLights === 'Off'
      ? 0.0
      : state.exteriorLights === 'Daytime Running Light'
      ? 0.25
      : 1.0;

  const isChargingView =
    state.primaryTab === 'Vehicle' && state.vehicleSubTab === 'Charging';
  const isDynamicsView =
    state.primaryTab === 'Vehicle' && state.vehicleSubTab === 'Dynamics';
  const isListenView = state.primaryTab === 'Listen';

  const airflowStreamIntensity = state.windTunnelActive ? 1.0 : 0.0;
  const rearRedWakeIntensity =
    isChargingView || state.rearWing !== 'Stowed' ? 0.85 : 0.25;

  const xrayDrivetrainIntensity = isDynamicsView ? 1.0 : 0.0;
  const xrayBatteryIntensity = isChargingView ? 1.0 : 0.0;

  const thrusterNozzleGlow =
    state.cameraPreset === 'rearAero' ||
    state.cameraPreset === 'rearWing34' ||
    state.cameraPreset === 'rearDynamicsXray' ||
    state.boostFiring
      ? 1.0
      : 0.55;

  const thrusterPlumeIntensity = state.boostFiring ? 1.0 : 0.0;
  const fanSpinIntensity =
    state.fanMode === 'Max Grip'
      ? 1.0
      : state.fanMode === 'Low Drag'
      ? 0.65
      : state.fanMode === 'Braking'
      ? 0.4
      : 0.0;

  const wheelSpinSpeed = state.windTunnelActive
    ? 14.0
    : state.trackModeView !== 'Off'
    ? 18.0
    : state.boostFiring
    ? 24.0
    : 1.8;

  const silhouetteDarkness = isListenView ? 1.0 : 0.0;

  return {
    rearWingDeploy,
    frontWingDeploy,
    bargeBoardDeploy,
    hoodVentOpen,
    rideHeightOffset,
    headlightIntensity,
    airflowStreamIntensity,
    rearRedWakeIntensity,
    xrayDrivetrainIntensity,
    xrayBatteryIntensity,
    thrusterNozzleGlow,
    thrusterPlumeIntensity,
    fanSpinIntensity,
    wheelSpinSpeed,
    silhouetteDarkness,
  };
}

export function getReferenceFramePath(timeSec: number): string {
  const clamped = Math.max(1, Math.min(33, Math.floor(timeSec) + 1));
  return `/assets/roadster/frames/sec_${String(clamped).padStart(2, '0')}.jpg`;
}

/**
 * Deterministic 1:1 cue sheet matching all 33 frames (sec_01.jpg .. sec_33.jpg) of `fdFyXTdJPLA`
 */
export function getCockpitStateAtTime(timeSec: number): CockpitState {
  const t = Math.max(0, Math.min(33.56, timeSec));
  const s: CockpitState = {
    ...INITIAL_COCKPIT_STATE,
    tires: INITIAL_COCKPIT_STATE.tires.map((tire) => ({...tire})),
  };

  // sec_01.jpg (0.0s .. 1.0s): Side Aero Wind-Tunnel View (D gear, 65%, Wed Jan 7 · 7:05 PM, Cabin 65, Muted)
  if (t < 1.0) {
    s.gear = 'D';
    s.batteryPct = 65;
    s.dateTimeStr = 'Wed Jan 7 · 7:05 PM';
    s.cabinTempF = 65;
    s.volumeMuted = true;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'sideAero';
    s.activeHotspot = 'none';
    s.windTunnelActive = true;
    s.rearWing = 'Low Drag';
    s.activeTrackTitle = 'Linen Hour';
    s.activeTrackArtist = 'Hollow Radio';
    s.activeTrackCover = '/assets/roadster/albums/linen_hour.jpg';
    s.mediaElapsedSec = 91; // 01:31
    s.mediaDurationSec = 176; // 02:56
    return s;
  }

  // sec_02.jpg (1.0s .. 2.0s): Rear Top-Down Aero Streamlines + 8 Golden Nozzles (01:32 / 02:56)
  if (t < 2.0) {
    s.gear = 'D';
    s.batteryPct = 65;
    s.dateTimeStr = 'Wed Jan 7 · 7:05 PM';
    s.cabinTempF = 65;
    s.volumeMuted = true;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearAero';
    s.activeHotspot = 'none';
    s.windTunnelActive = true;
    s.rearWing = 'Low Drag';
    s.activeTrackTitle = 'Linen Hour';
    s.activeTrackArtist = 'Hollow Radio';
    s.activeTrackCover = '/assets/roadster/albums/linen_hour.jpg';
    s.mediaElapsedSec = 92; // 01:32
    s.mediaDurationSec = 176; // 02:56
    return s;
  }

  // sec_03.jpg .. sec_05.jpg (2.0s .. 5.0s): Rear 3/4 Active Rear Wing Popup (Stowed -> High Downforce -> Low Drag)
  if (t < 5.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.cabinTempF = 68;
    s.volumeMuted = false;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearWing34';
    s.activeHotspot = 'rearWing';
    s.windTunnelActive = false;
    s.rearWing = t < 3.0 ? 'Stowed' : t < 4.0 ? 'High Downforce' : 'Low Drag';
    s.activeTrackTitle = 'Glass Weather';
    s.activeTrackArtist = 'Lumen Vale';
    s.activeTrackCover = '/assets/roadster/albums/glass_weather.jpg';
    s.mediaElapsedSec = t < 3.0 ? 142 : t < 4.0 ? 143 : 145; // 02:22, 02:23, 02:25
    s.mediaDurationSec = 236; // 03:56
    return s;
  }

  // sec_06.jpg .. sec_07.jpg (5.0s .. 7.0s): Side Profile Barge Board Popup (Retract -> Deploy)
  if (t < 7.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.cabinTempF = 68;
    s.volumeMuted = false;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'sideBarge';
    s.activeHotspot = 'bargeBoard';
    s.windTunnelActive = false;
    s.bargeBoardDeployed = t >= 6.0; // sec_06 = Retract (closed), sec_07 = Deploy (deployed crimson quad mesh)
    s.rearWing = 'Low Drag';
    s.activeTrackTitle = 'Glass Weather';
    s.activeTrackArtist = 'Lumen Vale';
    s.activeTrackCover = '/assets/roadster/albums/glass_weather.jpg';
    s.mediaElapsedSec = t < 6.0 ? 146 : 147; // 02:26, 02:27
    s.mediaDurationSec = 236;
    return s;
  }

  // sec_08.jpg .. sec_09.jpg (7.0s .. 9.0s): Front 3/4 Hood Vent Popup (Close -> Open)
  if (t < 9.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.cabinTempF = 68;
    s.volumeMuted = false;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'frontHood';
    s.activeHotspot = 'hoodVent';
    s.windTunnelActive = false;
    s.bargeBoardDeployed = true;
    s.hoodVentOpen = t >= 8.0; // sec_08 = Close, sec_09 = Open
    s.exteriorLights = 'On';
    s.activeTrackTitle = 'Glass Weather';
    s.activeTrackArtist = 'Lumen Vale';
    s.activeTrackCover = '/assets/roadster/albums/glass_weather.jpg';
    s.mediaElapsedSec = t < 8.0 ? 148 : 149; // 02:28, 02:29
    s.mediaDurationSec = 236;
    return s;
  }

  // sec_10.jpg .. sec_12.jpg (9.0s .. 12.0s): Front 3/4 Exterior Lights Popup (On -> Daytime Running Light -> Auto)
  if (t < 12.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.cabinTempF = 68;
    s.volumeMuted = false;
    s.primaryTab = 'Home';
    s.trackModeView = 'Off';
    s.cameraPreset = 'frontLights';
    s.activeHotspot = 'exteriorLights';
    s.windTunnelActive = false;
    s.hoodVentOpen = true;
    s.bargeBoardDeployed = true;
    s.exteriorLights =
      t < 10.0 ? 'On' : t < 11.0 ? 'Daytime Running Light' : 'Auto';
    s.activeTrackTitle = 'Glass Weather';
    s.activeTrackArtist = 'Lumen Vale';
    s.activeTrackCover = '/assets/roadster/albums/glass_weather.jpg';
    s.mediaElapsedSec = t < 10.0 ? 150 : t < 11.0 ? 151 : 152; // 02:30, 02:31, 02:32
    s.mediaDurationSec = 236;
    return s;
  }

  // sec_13.jpg (12.0s .. 13.0s): Track Mode Dashboard Lap 24/60 (0:15.291)
  if (t < 13.0) {
    s.gear = 'D';
    s.batteryPct = 86;
    s.primaryTab = 'Vehicle';
    s.trackModeView = 'Dashboard';
    s.dateTimeStr = 'Tue Oct 20 · 5:41 PM';
    s.currentLap = 24;
    s.totalLaps = 60;
    s.lapElapsedSec = 15.291;
    s.brakePedalPct = 36;
    s.accelPedalPct = 0;
    s.regenPct = 62;
    s.batteryTempF = 101;
    s.motorTempF = 204;
    s.elevationFt = 90;
    s.sector1Time = '15.2';
    s.sector2Time = '--.--';
    s.sector3Time = '--.--';
    s.trackProgress = 0.4;
    s.gForceX = -1.75;
    s.gForceY = 0.25;
    s.trackAeroProfile = 'Auto';
    s.frontWing = 'High Downforce';
    s.rearWing = 'High Downforce';
    s.hoodVentOpen = false;
    s.bargeBoardDeployed = true;
    s.aeroLoad = 'Max Grip';
    s.fanMode = 'Max Grip';
    s.brakeBalanceStep = -1;
    s.aeroBalanceStep = 1;
    return s;
  }

  // sec_14.jpg .. sec_15.jpg (13.0s .. 15.0s): Track Mode Dashboard Lap 25/60 (0:00.305 -> 0:01.318)
  if (t < 15.0) {
    s.gear = 'D';
    s.batteryPct = 86;
    s.primaryTab = 'Vehicle';
    s.trackModeView = 'Dashboard';
    s.dateTimeStr = 'Tue Oct 20 · 5:41 PM';
    s.currentLap = 25;
    s.totalLaps = 60;
    s.lapElapsedSec = t < 14.0 ? 0.305 : 1.318;
    s.brakePedalPct = 0;
    s.accelPedalPct = 0;
    s.regenPct = 0;
    s.batteryTempF = 94;
    s.motorTempF = 179;
    s.elevationFt = 37;
    s.sector1Time = '0.0';
    s.sector2Time = '--.--';
    s.sector3Time = '--.--';
    s.trackProgress = t < 14.0 ? 0.01 : 0.03;
    s.gForceX = 0;
    s.gForceY = 0;
    s.tires = [
      {id: 'FL', psi: 27, tempF: 174, brakeTempF: 860},
      {id: 'FR', psi: 27, tempF: 174, brakeTempF: 860},
      {id: 'RL', psi: 27, tempF: 173, brakeTempF: 616},
      {id: 'RR', psi: 27, tempF: 173, brakeTempF: 616},
    ];
    s.trackAeroProfile = 'Auto';
    s.frontWing = 'High Downforce';
    s.rearWing = 'High Downforce';
    s.hoodVentOpen = false;
    s.bargeBoardDeployed = true;
    s.aeroLoad = 'Max Grip';
    s.fanMode = 'Max Grip';
    s.brakeBalanceStep = -1;
    s.aeroBalanceStep = 1;
    return s;
  }

  // sec_16.jpg .. sec_19.jpg (15.0s .. 19.0s): Track Mode Setup Screen
  if (t < 19.0) {
    s.gear = 'D';
    s.batteryPct = 86;
    s.primaryTab = 'Vehicle';
    s.trackModeView = 'Setup';
    s.currentLap = 24;
    s.totalLaps = 60;
    s.dateTimeStr = t < 17.0 ? 'Tue Oct 20 · 5:41 PM' : 'Tue Oct 20 · 5:42 PM';
    if (t < 17.0) {
      // sec_16 & sec_17: Auto profile active (0:17.430 / 0:18.401)
      s.lapElapsedSec = t < 16.0 ? 17.43 : 18.401;
      s.trackAeroProfile = 'Auto';
      s.frontWing = 'High Downforce';
      s.rearWing = 'High Downforce';
      s.aeroLoad = 'Max Grip';
      s.fanMode = 'Max Grip';
      s.aeroBalanceStep = 1; // FRONT 48% / REAR 52%
      s.brakeBalanceStep = -1; // FRONT 62% / REAR 38%
      s.hoodVentOpen = true;
      s.bargeBoardDeployed = false;
    } else if (t < 18.0) {
      // sec_18: Custom profile active, Aero Balance +3 (44% / 56%)
      s.lapElapsedSec = 28.812;
      s.trackAeroProfile = 'Custom';
      s.frontWing = 'High Downforce';
      s.rearWing = 'Low Drag';
      s.aeroLoad = 'Low Drag';
      s.fanMode = 'Low Drag';
      s.aeroBalanceStep = 3; // FRONT 44% / REAR 56%
      s.brakeBalanceStep = -1; // FRONT 62% / REAR 38%
      s.hoodVentOpen = true;
      s.bargeBoardDeployed = false;
    } else {
      // sec_19: Custom profile active, Aero Balance 0 (50% / 50%)
      s.lapElapsedSec = 29.798;
      s.trackAeroProfile = 'Custom';
      s.frontWing = 'High Downforce';
      s.rearWing = 'Low Drag';
      s.aeroLoad = 'Low Drag';
      s.fanMode = 'Low Drag';
      s.aeroBalanceStep = 0; // FRONT 50% / REAR 50%
      s.brakeBalanceStep = -1; // FRONT 62% / REAR 38%
      s.hoodVentOpen = true;
      s.bargeBoardDeployed = false;
    }
    return s;
  }

  // sec_20.jpg .. sec_22.jpg (19.0s .. 22.0s): Return to Track Mode Dashboard with Custom Setup (0:38.128 .. 0:40.129)
  if (t < 22.0) {
    s.gear = 'D';
    s.batteryPct = 86;
    s.primaryTab = 'Vehicle';
    s.trackModeView = 'Dashboard';
    s.currentLap = 24;
    s.totalLaps = 60;
    s.dateTimeStr = 'Tue Oct 20 · 5:42 PM';
    s.batteryTempF = 102;
    s.motorTempF = 196;
    s.sector1Time = '28.4';
    s.sector3Time = '--.--';
    s.trackAeroProfile = 'Custom';
    s.frontWing = 'High Downforce';
    s.rearWing = 'Low Drag';
    s.hoodVentOpen = false;
    s.bargeBoardDeployed = true;
    s.aeroLoad = 'Low Drag';
    s.fanMode = 'Low Drag';
    s.brakeBalanceStep = 1; // 55% +1 45%
    s.aeroBalanceStep = -1; // 46% -1 54%

    if (t < 20.0) {
      // sec_20.jpg
      s.lapElapsedSec = 38.128;
      s.brakePedalPct = 0;
      s.accelPedalPct = 100;
      s.regenPct = 0;
      s.elevationFt = 45;
      s.sector2Time = '9.7';
      s.trackProgress = 0.64;
      s.gForceX = -0.15;
      s.gForceY = -0.35;
      s.tires = [
        {id: 'FL', psi: 28, tempF: 182, brakeTempF: 987},
        {id: 'FR', psi: 28, tempF: 183, brakeTempF: 987},
        {id: 'RL', psi: 28, tempF: 182, brakeTempF: 705},
        {id: 'RR', psi: 28, tempF: 182, brakeTempF: 705},
      ];
    } else if (t < 21.0) {
      // sec_21.jpg
      s.lapElapsedSec = 39.113;
      s.brakePedalPct = 4;
      s.accelPedalPct = 8;
      s.regenPct = 30;
      s.elevationFt = 49;
      s.sector2Time = '10.6';
      s.trackProgress = 0.68;
      s.gForceX = 1.45;
      s.gForceY = -0.15;
      s.tires = [
        {id: 'FL', psi: 28, tempF: 182, brakeTempF: 976},
        {id: 'FR', psi: 28, tempF: 182, brakeTempF: 976},
        {id: 'RL', psi: 28, tempF: 181, brakeTempF: 697},
        {id: 'RR', psi: 28, tempF: 181, brakeTempF: 697},
      ];
    } else {
      // sec_22.jpg
      s.lapElapsedSec = 40.129;
      s.brakePedalPct = 8;
      s.accelPedalPct = 75;
      s.regenPct = 22;
      s.elevationFt = 52;
      s.sector2Time = '11.7';
      s.trackProgress = 0.72;
      s.gForceX = 1.35;
      s.gForceY = -0.25;
      s.tires = [
        {id: 'FL', psi: 28, tempF: 182, brakeTempF: 979},
        {id: 'FR', psi: 28, tempF: 183, brakeTempF: 979},
        {id: 'RL', psi: 28, tempF: 181, brakeTempF: 699},
        {id: 'RR', psi: 28, tempF: 182, brakeTempF: 699},
      ];
    }
    return s;
  }

  // sec_23.jpg & ui_3.jpg (22.0s .. 23.0s): Vehicle -> Charging X-Ray Cutaway
  if (t < 23.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.primaryTab = 'Vehicle';
    s.vehicleSubTab = 'Charging';
    s.trackModeView = 'Off';
    s.dateTimeStr = 'Wed Oct 7 · 5:39 PM';
    s.cameraPreset = 'sideChargingXray';
    s.activeHotspot = 'none';
    s.rearWing = 'High Downforce';
    s.chargeLimitPct = 90;
    s.mediaElapsedSec = 109;
    s.mediaDurationSec = 176;
    return s;
  }

  // sec_24.jpg .. sec_27.jpg & ui_4.jpg (23.0s .. 27.0s): Listen Screen (Overview -> AlbumDetail -> Overview)
  if (t < 27.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.primaryTab = 'Listen';
    s.trackModeView = 'Off';
    s.listenSubView = t >= 25.0 && t < 26.0 ? 'AlbumDetail' : 'Overview';
    s.cameraPreset = 'listenSilhouette';
    s.activeHotspot = 'none';
    s.activeTrackTitle = 'To The Stars';
    s.activeTrackArtist = 'Horizon One';
    s.activeTrackCover = '/assets/roadster/albums/to_the_stars.jpg';
    s.mediaElapsedSec = t < 24.0 ? 123 : t < 25.0 ? 131 : t < 26.0 ? 137 : 2; // 02:03, 02:11, 02:17, 00:02
    s.mediaDurationSec = 236;
    return s;
  }

  // sec_28.jpg (27.0s .. 28.0s): Vehicle -> Dynamics X-Ray (Comfort Preset: Chill / Comfort / Standard)
  if (t < 28.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.primaryTab = 'Vehicle';
    s.vehicleSubTab = 'Dynamics';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearDynamicsXray';
    s.activeHotspot = 'none';
    s.dynamicsPreset = 'Comfort';
    s.accelerationMode = 'Chill';
    s.rideHandlingMode = 'Comfort';
    s.suspensionMode = 'Standard';
    s.rearWing = 'Stowed';
    return s;
  }

  // sec_29.jpg (28.0s .. 29.0s): Vehicle -> Dynamics X-Ray (Balance Preset: Standard / Balance / Standard)
  if (t < 29.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.primaryTab = 'Vehicle';
    s.vehicleSubTab = 'Dynamics';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearDynamicsXray';
    s.activeHotspot = 'none';
    s.dynamicsPreset = 'Balance';
    s.accelerationMode = 'Standard';
    s.rideHandlingMode = 'Balance';
    s.suspensionMode = 'Standard';
    s.rearWing = 'Stowed';
    return s;
  }

  // sec_30.jpg .. sec_31.jpg (29.0s .. 31.0s): Vehicle -> Dynamics Custom Matrix (Rear Wing Stowed, Suspension Standard)
  if (t < 31.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.primaryTab = 'Vehicle';
    s.vehicleSubTab = 'Dynamics';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearDynamicsXray';
    s.activeHotspot = 'none';
    s.dynamicsPreset = 'Custom';
    s.accelerationMode = 'Sport';
    s.rideHandlingMode = 'Sport';
    s.frontWing = 'Low Drag';
    s.rearWing = 'Stowed';
    s.suspensionMode = 'Standard';
    s.hoodVentOpen = false;
    s.bargeBoardDeployed = false;
    return s;
  }

  // sec_32.jpg (31.0s .. 32.0s): Vehicle -> Dynamics Custom Matrix (Rear Wing High Downforce, Suspension Standard)
  if (t < 32.0) {
    s.gear = 'P';
    s.batteryPct = 86;
    s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
    s.primaryTab = 'Vehicle';
    s.vehicleSubTab = 'Dynamics';
    s.trackModeView = 'Off';
    s.cameraPreset = 'rearDynamicsXray';
    s.activeHotspot = 'none';
    s.dynamicsPreset = 'Custom';
    s.accelerationMode = 'Sport';
    s.rideHandlingMode = 'Sport';
    s.frontWing = 'Low Drag';
    s.rearWing = 'High Downforce';
    s.suspensionMode = 'Standard';
    s.hoodVentOpen = false;
    s.bargeBoardDeployed = false;
    return s;
  }

  // sec_33.jpg (32.0s .. 33.56s): Vehicle -> Dynamics Custom Matrix (Rear Wing Low Drag + Suspension Low Drop)
  s.gear = 'P';
  s.batteryPct = 86;
  s.dateTimeStr = 'Wed Oct 7 · 5:38 PM';
  s.primaryTab = 'Vehicle';
  s.vehicleSubTab = 'Dynamics';
  s.trackModeView = 'Off';
  s.cameraPreset = 'rearDynamicsXray';
  s.activeHotspot = 'none';
  s.dynamicsPreset = 'Custom';
  s.accelerationMode = 'Sport';
  s.rideHandlingMode = 'Sport';
  s.frontWing = 'Low Drag';
  s.rearWing = 'Low Drag';
  s.suspensionMode = 'Low';
  s.hoodVentOpen = false;
  s.bargeBoardDeployed = false;
  return s;
}


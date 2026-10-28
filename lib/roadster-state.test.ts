import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_COCKPIT_STATE,
  calculateBalanceSplit,
  stepThrusterBoost,
  computeTargetCarAnimations,
  getCockpitStateAtTime,
  formatTrackTimer,
} from './roadster-state';

test('formatTrackTimer formats lap seconds to M:SS.mmm tabular string', () => {
  assert.equal(formatTrackTimer(16.306), '0:16.306');
  assert.equal(formatTrackTimer(98.902), '1:38.902');
});

test('calculateBalanceSplit matches exact video front/rear percentages', () => {
  const dashAero = calculateBalanceSplit(1, 'aero', false);
  assert.equal(dashAero.frontPct, 44);
  assert.equal(dashAero.rearPct, 56);
  assert.equal(dashAero.formattedStep, '+1');

  const setupAero = calculateBalanceSplit(1, 'aero', true);
  assert.equal(setupAero.frontPct, 48);
  assert.equal(setupAero.rearPct, 52);

  const setupAeroPlus3 = calculateBalanceSplit(3, 'aero', true, true);
  assert.equal(setupAeroPlus3.frontPct, 44);
  assert.equal(setupAeroPlus3.rearPct, 56);
  assert.equal(setupAeroPlus3.formattedStep, '+3');

  const setupAeroCustomZero = calculateBalanceSplit(0, 'aero', true, true);
  assert.equal(setupAeroCustomZero.frontPct, 50);
  assert.equal(setupAeroCustomZero.rearPct, 50);

  const dashAeroNeg1 = calculateBalanceSplit(-1, 'aero', false, true);
  assert.equal(dashAeroNeg1.frontPct, 46);
  assert.equal(dashAeroNeg1.rearPct, 54);
  assert.equal(dashAeroNeg1.formattedStep, '-1');

  const dashBrake = calculateBalanceSplit(-1, 'brake', false);
  assert.equal(dashBrake.frontPct, 57);
  assert.equal(dashBrake.rearPct, 43);
  assert.equal(dashBrake.formattedStep, '-1');

  const dashBrakePos1 = calculateBalanceSplit(1, 'brake', false, true);
  assert.equal(dashBrakePos1.frontPct, 55);
  assert.equal(dashBrakePos1.rearPct, 45);
  assert.equal(dashBrakePos1.formattedStep, '+1');

  const setupBrake = calculateBalanceSplit(-1, 'brake', true);
  assert.equal(setupBrake.frontPct, 62);
  assert.equal(setupBrake.rearPct, 38);
});

test('stepThrusterBoost depletes from 5,500 PSI on boost and recharges when released', () => {
  const discharged = stepThrusterBoost(5500, true, 1.0);
  assert.equal(discharged.psi < 5500, true);
  assert.equal(discharged.pct < 100, true);

  const recharged = stepThrusterBoost(discharged.psi, false, 3.0);
  assert.equal(recharged.psi, 5500);
  assert.equal(recharged.pct, 100);
  assert.equal(recharged.boostReady, true);
});

test('computeTargetCarAnimations maps cockpit controls and DRL vs On lights to 3D Roadster animations', () => {
  const highDownforceState = {
    ...INITIAL_COCKPIT_STATE,
    rearWing: 'High Downforce' as const,
    frontWing: 'High Downforce' as const,
    bargeBoardDeployed: true,
    hoodVentOpen: true,
    suspensionMode: 'Low' as const,
    exteriorLights: 'On' as const,
    boostFiring: true,
  };
  const anim = computeTargetCarAnimations(highDownforceState);
  assert.equal(anim.rearWingDeploy, 1.0);
  assert.equal(anim.frontWingDeploy, 1.0);
  assert.equal(anim.bargeBoardDeploy, 1.0);
  assert.equal(anim.hoodVentOpen, 1.0);
  assert.equal(anim.rideHeightOffset, -0.14);
  assert.equal(anim.headlightIntensity, 1.0);
  assert.equal(anim.thrusterPlumeIntensity, 1.0);

  const drlState = {
    ...INITIAL_COCKPIT_STATE,
    exteriorLights: 'Daytime Running Light' as const,
  };
  const drlAnim = computeTargetCarAnimations(drlState);
  assert.equal(drlAnim.headlightIntensity, 0.25);
});

test('getCockpitStateAtTime reproduces all 33 seconds of video frames accurately', () => {
  // sec_01: Side aero wind tunnel, D gear, 65%, muted
  const s1 = getCockpitStateAtTime(0.5);
  assert.equal(s1.cameraPreset, 'sideAero');
  assert.equal(s1.windTunnelActive, true);
  assert.equal(s1.gear, 'D');
  assert.equal(s1.batteryPct, 65);
  assert.equal(s1.volumeMuted, true);

  // sec_02: Rear 3/4 aero wind tunnel
  const s2 = getCockpitStateAtTime(1.5);
  assert.equal(s2.cameraPreset, 'rearAero');
  assert.equal(s2.windTunnelActive, true);

  // sec_03..05: Rear Wing Stowed -> High Downforce -> Low Drag
  assert.equal(getCockpitStateAtTime(2.5).rearWing, 'Stowed');
  assert.equal(getCockpitStateAtTime(3.6).rearWing, 'High Downforce');
  assert.equal(getCockpitStateAtTime(4.5).rearWing, 'Low Drag');

  // sec_06..07: Barge Board Retract -> Deploy
  assert.equal(getCockpitStateAtTime(5.5).bargeBoardDeployed, false);
  assert.equal(getCockpitStateAtTime(6.5).bargeBoardDeployed, true);

  // sec_08..09: Hood Vent Close -> Open
  assert.equal(getCockpitStateAtTime(7.5).hoodVentOpen, false);
  assert.equal(getCockpitStateAtTime(8.5).hoodVentOpen, true);

  // sec_10..12: Exterior Lights On -> Daytime Running Light -> Auto
  assert.equal(getCockpitStateAtTime(9.5).exteriorLights, 'On');
  assert.equal(getCockpitStateAtTime(10.5).exteriorLights, 'Daytime Running Light');
  assert.equal(getCockpitStateAtTime(11.5).exteriorLights, 'Auto');

  // sec_13..15: Track Mode Dashboard (Lap 24/25)
  const s14 = getCockpitStateAtTime(13.5);
  assert.equal(s14.trackModeView, 'Dashboard');
  assert.equal(s14.thrusterPsi, 5500);

  // sec_16..19: Track Mode Setup (Auto -> Custom +3 -> 0)
  assert.equal(getCockpitStateAtTime(15.5).trackModeView, 'Setup');
  assert.equal(getCockpitStateAtTime(15.5).trackAeroProfile, 'Auto');
  assert.equal(getCockpitStateAtTime(17.5).trackAeroProfile, 'Custom');
  assert.equal(getCockpitStateAtTime(17.5).aeroBalanceStep, 3);
  assert.equal(getCockpitStateAtTime(18.5).aeroBalanceStep, 0);

  // sec_20..22: Track Mode Dashboard (Custom Dynamics, Fan Low Drag, -1 / +1 balances)
  const s21 = getCockpitStateAtTime(20.5);
  assert.equal(s21.trackModeView, 'Dashboard');
  assert.equal(s21.trackAeroProfile, 'Custom');
  assert.equal(s21.fanMode, 'Low Drag');
  assert.equal(s21.aeroBalanceStep, -1);
  assert.equal(s21.brakeBalanceStep, 1);

  // sec_23: Vehicle -> Charging (90% limit)
  const s23 = getCockpitStateAtTime(22.5);
  assert.equal(s23.primaryTab, 'Vehicle');
  assert.equal(s23.vehicleSubTab, 'Charging');
  assert.equal(s23.chargeLimitPct, 90);

  // sec_24..27: Listen Overview -> AlbumDetail -> Overview
  assert.equal(getCockpitStateAtTime(23.5).primaryTab, 'Listen');
  assert.equal(getCockpitStateAtTime(23.5).listenSubView, 'Overview');
  assert.equal(getCockpitStateAtTime(25.5).listenSubView, 'AlbumDetail');
  assert.equal(getCockpitStateAtTime(26.5).listenSubView, 'Overview');

  // sec_28..33: Vehicle -> Dynamics (Comfort -> Balance -> Custom Stowed -> High Downforce -> Low Drag + Low)
  assert.equal(getCockpitStateAtTime(27.5).dynamicsPreset, 'Comfort');
  assert.equal(getCockpitStateAtTime(28.5).dynamicsPreset, 'Balance');
  assert.equal(getCockpitStateAtTime(30.5).dynamicsPreset, 'Custom');
  assert.equal(getCockpitStateAtTime(30.5).rearWing, 'Stowed');
  assert.equal(getCockpitStateAtTime(31.5).rearWing, 'High Downforce');
  const s33 = getCockpitStateAtTime(32.5);
  assert.equal(s33.dynamicsPreset, 'Custom');
  assert.equal(s33.rearWing, 'Low Drag');
  assert.equal(s33.suspensionMode, 'Low');
});


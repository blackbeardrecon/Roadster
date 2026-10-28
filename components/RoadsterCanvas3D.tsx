'use client';

import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {
  CameraPreset,
  CockpitState,
  ExteriorLightsState,
  HotspotPopupId,
  RearWingState,
  computeTargetCarAnimations,
} from '@/lib/roadster-state';

interface RoadsterCanvas3DProps {
  state: CockpitState;
  onSelectHotspot: (hotspot: HotspotPopupId, preset?: CameraPreset) => void;
  onChangeRearWing: (wing: RearWingState) => void;
  onToggleBargeBoard: (deploy: boolean) => void;
  onToggleHoodVent: (open: boolean) => void;
  onChangeExteriorLights: (lights: ExteriorLightsState) => void;
  onToggleWindTunnel: () => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
  onToggleWireframeMode?: () => void;
}

interface VoladorZoneMeta {
  triOffset: number;
  triCount: number;
  creaseOffset: number;
  creaseVertCount: number;
  gridOffset: number;
  gridVertCount: number;
  center: [number, number, number];
}

interface VoladorAssetManifest {
  numVerts: number;
  posOffset: number;
  normOffset: number;
  zones: Record<string, VoladorZoneMeta>;
}

/**
 * Camera presets matching the exact framing & orientation of fdFyXTdJPLA and image.png:
 * Note: Roadster Root is rotated so Nose points Left (-X in world space)
 * and Rear Tail + 8 Golden Nozzles point Right (+X in world space), matching
 * sec_01.jpg, ui_1.jpg, ui_3.jpg, ui_5.jpg, maxres1.jpg, maxres2.jpg, and image.png.
 */
const CAMERA_TARGETS: Record<
  CameraPreset,
  {pos: [number, number, number]; lookAt: [number, number, number]; fov: number}
> = {
  // 00:00 sec_01.jpg: Side wind-tunnel aero view (nose left, tail right)
  sideAero: {pos: [0.0, 1.08, 6.85], lookAt: [0.0, 0.48, 0], fov: 32},
  // 00:01.5 sec_02.jpg: Top-down rear 3/4 aero streamlines + 8 golden nozzles
  rearAero: {pos: [4.85, 2.25, 2.35], lookAt: [0.35, 0.45, 0], fov: 33},
  // 00:03 ui_1.jpg: Rear 3/4 view showing Rear Wing + 8 Golden Nozzles
  rearWing34: {pos: [4.65, 1.18, 4.35], lookAt: [0.15, 0.46, 0], fov: 32},
  // 00:05 sec_06.jpg: Side profile focusing on Barge Board behind front wheel
  sideBarge: {pos: [-0.45, 1.05, 6.45], lookAt: [-0.25, 0.46, 0], fov: 31},
  // 00:07 maxres1.jpg: Elevated front 3/4 view focusing on Hood Vent
  frontHood: {pos: [-4.55, 1.65, 4.25], lookAt: [-0.2, 0.44, 0], fov: 32},
  // 00:09 maxres2.jpg: Low front 3/4 view focusing on Exterior Lights
  frontLights: {pos: [-4.65, 1.08, 4.45], lookAt: [-0.25, 0.44, 0], fov: 32},
  // 00:22 ui_3.jpg / sec_23.jpg: Side profile X-Ray (nose on right, rear wing & wake on left)
  sideChargingXray: {pos: [0.0, 1.06, -6.75], lookAt: [0.0, 0.36, 0], fov: 32},
  // 00:24 ui_4.jpg: Dark silhouette centered behind Listen UI
  listenSilhouette: {pos: [0.1, 1.04, 6.65], lookAt: [0.0, 0.42, 0], fov: 32},
  // 00:27 sec_27.jpg: Front 3/4 X-Ray shifted right so left Dynamics UI has room
  frontDynamicsXray: {pos: [-4.45, 1.24, 4.75], lookAt: [-1.05, 0.44, 0], fov: 32},
  // 00:29 ui_5.jpg: Rear 3/4 X-Ray shifted right showing golden COPV & 8 nozzles
  rearDynamicsXray: {pos: [4.35, 1.22, 4.55], lookAt: [-0.95, 0.44, 0], fov: 32},
  // User reference screenshot image.png: Front-Left 3/4 elevated studio quad-wireframe view
  studioFrontLeft34: {pos: [-4.95, 2.25, 4.65], lookAt: [-0.05, 0.40, 0.0], fov: 28},
};

export default function RoadsterCanvas3D({
  state,
  onSelectHotspot,
  onChangeRearWing,
  onToggleBargeBoard,
  onToggleHoodVent,
  onChangeExteriorLights,
  onToggleWindTunnel,
  onCameraPresetChange,
  onToggleWireframeMode,
}: RoadsterCanvas3DProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<CockpitState>(state);
  stateRef.current = state;

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;
    let disposed = false;

    const width = container.clientWidth || window.innerWidth || 1440;
    const height = container.clientHeight || window.innerHeight || 900;

    const scene = new THREE.Scene();
    const bgCockpit = new THREE.Color(0x000000);
    const bgStudio = new THREE.Color(0xe4e5e8);
    scene.background = stateRef.current.wireframeRenderMode === 'studio' ? bgStudio : bgCockpit;
    const fog = new THREE.FogExp2(
      stateRef.current.wireframeRenderMode === 'studio' ? 0xd8dade : 0x000000,
      stateRef.current.wireframeRenderMode === 'studio' ? 0.018 : 0.048
    );
    scene.fog = fog;

    const initCam = CAMERA_TARGETS[stateRef.current.cameraPreset] || CAMERA_TARGETS.rearWing34;
    const camera = new THREE.PerspectiveCamera(initCam.fov, width / height, 0.1, 100);
    camera.position.set(initCam.pos[0], initCam.pos[1], initCam.pos[2]);
    camera.lookAt(initCam.lookAt[0], initCam.lookAt[1], initCam.lookAt[2]);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer();
      } catch {
        return;
      }
    }

    const isSoftwareGl = (() => {
      try {
        const gl = renderer.getContext();
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting Rig (supports both dark cockpit dual-pass and white studio mode 5)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.05);
    scene.add(ambientLight);

    const topKeyLight = new THREE.DirectionalLight(0xffffff, 3.1);
    topKeyLight.position.set(-2.2, 8.5, 4.2);
    scene.add(topKeyLight);

    const rearRimLight = new THREE.DirectionalLight(0xe2e8f0, 2.3);
    rearRimLight.position.set(5.5, 4.5, 2.5);
    scene.add(rearRimLight);

    const frontFillLight = new THREE.DirectionalLight(0x94a3b8, 1.65);
    frontFillLight.position.set(-5.0, 2.5, 4.0);
    scene.add(frontFillLight);

    const rearRedGlow = new THREE.PointLight(0xff1a1a, 3.0, 6.0);
    rearRedGlow.position.set(2.35, 0.68, 0);
    scene.add(rearRedGlow);

    const thrusterGoldLight = new THREE.PointLight(0xfbbf24, 2.4, 4.5);
    thrusterGoldLight.position.set(2.15, 0.32, 0);
    scene.add(thrusterGoldLight);

    // 1A. Perspective Dot-Matrix Ground Grid (Cockpit Dual-Pass Mode)
    const dotPositions: number[] = [];
    const dotColors: number[] = [];
    for (let gx = -16; gx <= 16; gx += 0.46) {
      for (let gz = -10; gz <= 10; gz += 0.46) {
        dotPositions.push(gx, 0.005, gz);
        const dist = Math.hypot(gx * 0.7, gz);
        const fade = Math.max(0.06, 1 - dist / 12.5);
        const isRedAccent = Math.abs(gx + gz) % 2.3 < 0.22;
        if (isRedAccent) {
          dotColors.push(0.95 * fade, 0.16 * fade, 0.16 * fade);
        } else {
          dotColors.push(0.78 * fade, 0.82 * fade, 0.88 * fade);
        }
      }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));
    const dotMat = new THREE.PointsMaterial({
      size: 0.036,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const floorDots = new THREE.Points(dotGeo, dotMat);
    scene.add(floorDots);

    // 1B. White Studio Cyclorama Ground & Soft Contact Shadow (Studio Mode 5 matching image.png)
    const studioFloorGroup = new THREE.Group();
    studioFloorGroup.visible = false;
    scene.add(studioFloorGroup);

    const studioFloorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e9ec,
      roughness: 0.92,
      metalness: 0.02,
    });
    const studioFloorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      studioFloorMat
    );
    studioFloorMesh.rotation.x = -Math.PI / 2;
    studioFloorMesh.position.y = -0.002;
    studioFloorGroup.add(studioFloorMesh);

    // Soft studio contact shadow beneath chassis
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 64, 18, 128, 64, 118);
      grad.addColorStop(0, 'rgba(20, 22, 26, 0.34)');
      grad.addColorStop(0.65, 'rgba(20, 22, 26, 0.14)');
      grad.addColorStop(1, 'rgba(20, 22, 26, 0.0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.3, 2.55),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = 0.002;
    studioFloorGroup.add(contactShadowMesh);

    // 2. Hierarchical Articulated Next-Gen Tesla Roadster 2.0 Group
    // Local car coordinates: +X = Front Nose, -X = Rear Tail, +Y = Up, +Z = Right Side.
    // roadsterRoot.rotation.y = Math.PI places Front Nose on Left (-X world) and Rear Tail on Right (+X world).
    const roadsterRoot = new THREE.Group();
    roadsterRoot.rotation.y = Math.PI;
    scene.add(roadsterRoot);

    const chassisGroup = new THREE.Group();
    roadsterRoot.add(chassisGroup);

    // Core Materials (with polygonOffset and DoubleSide to prevent z-fighting and back-face bleed)
    const bodyShellMat = new THREE.MeshStandardMaterial({
      color: 0x1c1f26,
      metalness: 0.75,
      roughness: 0.25,
      transparent: false,
      opacity: 1.0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const canopyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e14,
      metalness: 0.4,
      roughness: 0.14,
      transparent: false,
      opacity: 1.0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const wheelSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x161920,
      metalness: 0.55,
      roughness: 0.36,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const activeAeroSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      metalness: 0.68,
      roughness: 0.28,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const headlightSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe2e8f0,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const taillightSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0xff1e1e,
      emissive: 0xff1a1a,
      emissiveIntensity: 0.95,
      roughness: 0.22,
      metalness: 0.3,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    // Quad-Wireframe & Feature Crease Line Materials
    const bodyCreaseMat = new THREE.LineBasicMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.68,
    });

    const bodyWireframeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.36,
    });

    const canopyWireframeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.34,
    });

    const wheelWireframeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.48,
    });

    const rearWingWireMat = new THREE.LineBasicMaterial({
      color: 0xff1e1e,
      transparent: true,
      opacity: 0.92,
    });

    const rearWingBodySurfMat = bodyShellMat.clone();
    const rearWingBodyGridMat = bodyWireframeMat.clone();
    const rearWingBodyCreaseMat = bodyCreaseMat.clone();

    const frontSplitterWireMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.72,
    });

    const bargeBoardWireMat = new THREE.LineBasicMaterial({
      color: 0xff1e1e,
      transparent: true,
      opacity: 0.85,
    });

    const hoodVentWireMat = new THREE.LineBasicMaterial({
      color: 0xff1e1e,
      transparent: true,
      opacity: 0.85,
    });

    const lightsWireMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.75,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      metalness: 0.45,
      roughness: 0.48,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const crimsonEmissiveMat = new THREE.MeshBasicMaterial({
      color: 0xff1e1e,
    });

    const frontLedMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
    });

    const goldThrusterMat = new THREE.MeshStandardMaterial({
      color: 0xd99b26,
      emissive: 0xb45309,
      emissiveIntensity: 0.72,
      metalness: 0.78,
      roughness: 0.26,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const thrusterWireMat = new THREE.LineBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.88,
    });

    const thrusterCreaseMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.95,
    });

    const goldXrayInternalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.75,
      metalness: 0.65,
      roughness: 0.28,
      transparent: true,
      opacity: 0.0,
    });

    const goldXrayBatteryMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0xa16207,
      emissiveIntensity: 0.78,
      metalness: 0.58,
      roughness: 0.3,
      transparent: true,
      opacity: 0.0,
    });

    // Articulated Pivot Groups (aligned with exact centroids from tesla-volador-quad.json)
    const staticBodyZonesGroup = new THREE.Group();
    chassisGroup.add(staticBodyZonesGroup);

    const rearWingBaseCenter: [number, number, number] = [-1.98, 0.935, 0.0];
    const rearWingGroup = new THREE.Group();
    rearWingGroup.position.set(...rearWingBaseCenter);
    chassisGroup.add(rearWingGroup);

    const frontSplitterBaseCenter: [number, number, number] = [2.083, 0.1687, -0.0048];
    const frontSplitterGroup = new THREE.Group();
    frontSplitterGroup.position.set(...frontSplitterBaseCenter);
    chassisGroup.add(frontSplitterGroup);

    const hoodVentBaseCenter: [number, number, number] = [1.5266, 0.8566, 0.0133];
    const hoodVentGroup = new THREE.Group();
    hoodVentGroup.position.set(...hoodVentBaseCenter);
    chassisGroup.add(hoodVentGroup);

    const leftBargeBaseCenter: [number, number, number] = [-0.035, 0.1564, -0.9554];
    const leftBargeBoardGroup = new THREE.Group();
    leftBargeBoardGroup.position.set(...leftBargeBaseCenter);
    chassisGroup.add(leftBargeBoardGroup);

    const rightBargeBaseCenter: [number, number, number] = [-0.0314, 0.1556, 0.9595];
    const rightBargeBoardGroup = new THREE.Group();
    rightBargeBoardGroup.position.set(...rightBargeBaseCenter);
    chassisGroup.add(rightBargeBoardGroup);

    const wheelCenters: Record<string, [number, number, number]> = {
      wheel_fl: [1.4643, 0.3431, -0.861],
      wheel_fr: [1.4516, 0.353, 0.8461],
      wheel_rl: [-1.4856, 0.3576, -0.8705],
      wheel_rr: [-1.5229, 0.3598, 0.8724],
    };
    const wheelPivotMap: Record<string, THREE.Group> = {};
    const wheelGroups: THREE.Group[] = [];
    Object.entries(wheelCenters).forEach(([key, center]) => {
      const wg = new THREE.Group();
      wg.position.set(center[0], center[1], center[2]);
      roadsterRoot.add(wg);
      wheelPivotMap[key] = wg;
      wheelGroups.push(wg);
    });

    // Load the 1:1 Tesla Volador GLB Quad-Wireframe & Surface Geometry (/models/tesla-volador-quad.json + .bin)
    Promise.all([
      fetch('/models/tesla-volador-quad.json').then((r) => r.json() as Promise<VoladorAssetManifest>),
      fetch('/models/tesla-volador-quad.bin').then((r) => r.arrayBuffer()),
    ])
      .then(([manifest, arrayBuffer]) => {
        if (disposed) return;

        const posFloats = new Float32Array(
          arrayBuffer,
          manifest.posOffset,
          manifest.numVerts * 3
        );
        const normFloats = new Float32Array(
          arrayBuffer,
          manifest.normOffset,
          manifest.numVerts * 3
        );

        const sharedPosAttr = new THREE.BufferAttribute(posFloats, 3);
        const sharedNormAttr = new THREE.BufferAttribute(normFloats, 3);

        const attachZone = (
          zoneKey: string,
          targetParent: THREE.Group,
          surfMat: THREE.Material,
          gridWireMat: THREE.Material,
          creaseWireMat: THREE.Material,
          pivotCenter?: [number, number, number]
        ) => {
          const zMeta = manifest.zones[zoneKey];
          if (!zMeta) return null;

          const triGeo = new THREE.BufferGeometry();
          triGeo.setAttribute('position', sharedPosAttr);
          triGeo.setAttribute('normal', sharedNormAttr);
          const triIdx = new Uint16Array(arrayBuffer, zMeta.triOffset, zMeta.triCount);
          triGeo.setIndex(new THREE.BufferAttribute(triIdx, 1));
          const mesh = new THREE.Mesh(triGeo, surfMat);

          const group = new THREE.Group();
          group.add(mesh);

          if (zMeta.creaseVertCount > 0) {
            const creaseGeo = new THREE.BufferGeometry();
            const creaseFloats = new Float32Array(
              arrayBuffer,
              zMeta.creaseOffset,
              zMeta.creaseVertCount * 3
            );
            creaseGeo.setAttribute('position', new THREE.BufferAttribute(creaseFloats, 3));
            group.add(new THREE.LineSegments(creaseGeo, creaseWireMat));
          }

          if (zMeta.gridVertCount > 0) {
            const gridGeo = new THREE.BufferGeometry();
            const gridFloats = new Float32Array(
              arrayBuffer,
              zMeta.gridOffset,
              zMeta.gridVertCount * 3
            );
            gridGeo.setAttribute('position', new THREE.BufferAttribute(gridFloats, 3));
            group.add(new THREE.LineSegments(gridGeo, gridWireMat));
          }

          if (pivotCenter) {
            group.position.set(-pivotCenter[0], -pivotCenter[1], -pivotCenter[2]);
          }
          targetParent.add(group);
          return group;
        };

        // Static chassis zones
        attachZone('body', staticBodyZonesGroup, bodyShellMat, bodyWireframeMat, bodyCreaseMat);
        attachZone('canopy', staticBodyZonesGroup, canopyGlassMat, canopyWireframeMat, bodyCreaseMat);
        attachZone('headlights', staticBodyZonesGroup, headlightSurfaceMat, lightsWireMat, lightsWireMat);
        attachZone('taillights', staticBodyZonesGroup, taillightSurfaceMat, rearWingWireMat, rearWingWireMat);

        // Exact 8 recessed SpaceX Cold-Gas Thruster & Suction Fan housings from the wireframe mesh
        attachZone('thrusters', staticBodyZonesGroup, goldThrusterMat, thrusterWireMat, thrusterCreaseMat);

        // Articulated aero zones (rotating & deploying around their exact 3D centroids)
        // Rear Wing is the actual partitioned back piece of the car body (closed = 100% seamless car body)
        attachZone(
          'rear_wing',
          rearWingGroup,
          rearWingBodySurfMat,
          rearWingBodyGridMat,
          rearWingBodyCreaseMat,
          rearWingBaseCenter
        );
        attachZone(
          'front_splitter',
          frontSplitterGroup,
          activeAeroSurfaceMat,
          frontSplitterWireMat,
          frontSplitterWireMat,
          frontSplitterBaseCenter
        );
        attachZone(
          'hood_vent',
          hoodVentGroup,
          activeAeroSurfaceMat,
          hoodVentWireMat,
          hoodVentWireMat,
          hoodVentBaseCenter
        );
        attachZone(
          'barge_board_l',
          leftBargeBoardGroup,
          activeAeroSurfaceMat,
          bodyWireframeMat,
          bodyCreaseMat,
          leftBargeBaseCenter
        );
        attachZone(
          'barge_board_r',
          rightBargeBoardGroup,
          activeAeroSurfaceMat,
          bodyWireframeMat,
          bodyCreaseMat,
          rightBargeBaseCenter
        );

        // Articulated 4 multi-spoke wheels
        (['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'] as const).forEach((wKey) => {
          const pivotGroup = wheelPivotMap[wKey];
          const center = wheelCenters[wKey];
          if (pivotGroup && center) {
            attachZone(wKey, pivotGroup, wheelSurfaceMat, wheelWireframeMat, bodyCreaseMat, center);
          }
        });

        container.dataset.modelLoaded = 'true';
      })
      .catch((err) => {
        console.error('Failed to load Tesla Volador 3D asset:', err);
      });

    // 1. Recessed Inner Decklid Shelf & Strut Actuator Pockets (exposed inside static body when spoiler opens)
    // Seals the rear body cavity under the lifted spoiler and reflects the crimson taillight glow
    const recessedDecklidGroup = new THREE.Group();
    recessedDecklidGroup.visible = false;
    staticBodyZonesGroup.add(recessedDecklidGroup);
    {
      const rU = 4;
      const rV = 16;
      const shelfVerts: number[] = [];
      const shelfTris: number[] = [];
      const shelfLines: number[] = [];

      const evalInnerShelf = (u: number, v: number): [number, number, number] => {
        const z = v * 0.875;
        const xLead = -1.915 - 0.055 * v * v;
        const xTrail = -2.238 + 0.008 * v * v;
        const x = xLead * (1 - u) + xTrail * u;
        const y = (0.942 * (1 - u) + 0.878 * u) - 0.016 * v * v;
        return [x, y, z];
      };

      for (let iu = 0; iu <= rU; iu++) {
        const u = iu / rU;
        for (let iv = 0; iv <= rV; iv++) {
          const v = (iv / rV) * 2 - 1;
          const [x, y, z] = evalInnerShelf(u, v);
          shelfVerts.push(x, y, z);
        }
      }
      for (let iu = 0; iu < rU; iu++) {
        for (let iv = 0; iv < rV; iv++) {
          const a = iu * (rV + 1) + iv;
          const b = a + 1;
          const c = a + (rV + 1);
          const d = c + 1;
          shelfTris.push(a, c, b, b, c, d);
        }
      }
      for (let iu = 0; iu <= rU; iu++) {
        for (let iv = 0; iv < rV; iv++) {
          const a = (iu * (rV + 1) + iv) * 3;
          const b = (iu * (rV + 1) + iv + 1) * 3;
          shelfLines.push(
            shelfVerts[a], shelfVerts[a + 1], shelfVerts[a + 2],
            shelfVerts[b], shelfVerts[b + 1], shelfVerts[b + 2]
          );
        }
      }
      for (let iv = 0; iv <= rV; iv++) {
        for (let iu = 0; iu < rU; iu++) {
          const a = (iu * (rV + 1) + iv) * 3;
          const c = ((iu + 1) * (rV + 1) + iv) * 3;
          shelfLines.push(
            shelfVerts[a], shelfVerts[a + 1], shelfVerts[a + 2],
            shelfVerts[c], shelfVerts[c + 1], shelfVerts[c + 2]
          );
        }
      }

      // Inner quarter-panel step walls at z = +-0.875 and rear taillight step wall at u = 1
      ([-1, 1] as const).forEach((sSign) => {
        const baseIdx = shelfVerts.length / 3;
        for (let iu = 0; iu <= rU; iu++) {
          const u = iu / rU;
          const [xIn, yIn, zIn] = evalInnerShelf(u, sSign);
          const yOut = yIn + 0.022 * (1 - 0.3 * u);
          shelfVerts.push(xIn, yIn, zIn, xIn, yOut, zIn);
        }
        for (let iu = 0; iu < rU; iu++) {
          const a = baseIdx + iu * 2;
          const b = a + 1;
          const c = a + 2;
          const d = a + 3;
          shelfTris.push(a, b, c, b, d, c);
        }
      });

      const shelfGeo = new THREE.BufferGeometry();
      shelfGeo.setAttribute('position', new THREE.Float32BufferAttribute(shelfVerts, 3));
      shelfGeo.setIndex(shelfTris);
      shelfGeo.computeVertexNormals();
      recessedDecklidGroup.add(new THREE.Mesh(shelfGeo, bodyShellMat));

      const shelfWireGeo = new THREE.BufferGeometry();
      shelfWireGeo.setAttribute('position', new THREE.Float32BufferAttribute(shelfLines, 3));
      recessedDecklidGroup.add(new THREE.LineSegments(shelfWireGeo, bodyWireframeMat));

      // Two recessed rectangular strut actuator pockets on the inner decklid shelf at z = +-0.35
      const pocketGeo = new THREE.BoxGeometry(0.15, 0.012, 0.068);
      [-0.35, 0.35].forEach((zPos) => {
        const pocketMesh = new THREE.Mesh(pocketGeo, carbonMat);
        pocketMesh.position.set(-2.03, 0.892, zPos);
        pocketMesh.rotation.z = 0.16;
        recessedDecklidGroup.add(pocketMesh);

        const pocketRim = new THREE.LineSegments(
          new THREE.EdgesGeometry(pocketGeo),
          rearWingWireMat
        );
        pocketRim.position.copy(pocketMesh.position);
        pocketRim.rotation.copy(pocketMesh.rotation);
        recessedDecklidGroup.add(pocketRim);
      });
    }

    // 2. Deployed Spoiler Underside 4x16 Crimson Quad-Wireframe Grid, Silver Bevel Lips & Endplate Overlays
    // Hidden when Stowed so the closed car is 100% pure car body; revealed as the spoiler moves out & tilts
    const wingAeroUnderlayGroup = new THREE.Group();
    wingAeroUnderlayGroup.position.set(
      -rearWingBaseCenter[0],
      -rearWingBaseCenter[1],
      -rearWingBaseCenter[2]
    );
    wingAeroUnderlayGroup.visible = false;
    rearWingGroup.add(wingAeroUnderlayGroup);
    {
      const wingUndersideDarkMat = new THREE.MeshStandardMaterial({
        color: 0x110304,
        emissive: 0x260303,
        emissiveIntensity: 0.45,
        metalness: 0.45,
        roughness: 0.55,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      const nU = 4; // 4 chordwise quad rows on underside (matches zoom_high_downforce.jpg)
      const nV = 16; // 16 spanwise quad columns across rear wing width
      const underVerts: number[] = [];
      const underTris: number[] = [];
      const underLines: number[] = [];

      const evalUnderside = (u: number, v: number): [number, number, number] => {
        const z = v * 0.880;
        const xLead = -1.948 - 0.042 * v * v;
        const xTrail = -2.262 + 0.010 * v * v;
        const x = xLead * (1 - u) + xTrail * u;
        const y =
          (0.924 * (1 - u) + 0.871 * u) -
          0.014 * v * v +
          0.004 * Math.sin(u * Math.PI);
        return [x, y, z];
      };

      for (let iu = 0; iu <= nU; iu++) {
        const u = iu / nU;
        for (let iv = 0; iv <= nV; iv++) {
          const v = (iv / nV) * 2 - 1;
          const [x, y, z] = evalUnderside(u, v);
          underVerts.push(x, y, z);
        }
      }
      for (let iu = 0; iu < nU; iu++) {
        for (let iv = 0; iv < nV; iv++) {
          const a = iu * (nV + 1) + iv;
          const b = a + 1;
          const c = a + (nV + 1);
          const d = c + 1;
          underTris.push(a, b, c, b, d, c);
        }
      }
      for (let iu = 0; iu <= nU; iu++) {
        for (let iv = 0; iv < nV; iv++) {
          const a = (iu * (nV + 1) + iv) * 3;
          const b = (iu * (nV + 1) + iv + 1) * 3;
          underLines.push(
            underVerts[a], underVerts[a + 1], underVerts[a + 2],
            underVerts[b], underVerts[b + 1], underVerts[b + 2]
          );
        }
      }
      for (let iv = 0; iv <= nV; iv++) {
        for (let iu = 0; iu < nU; iu++) {
          const a = (iu * (nV + 1) + iv) * 3;
          const c = ((iu + 1) * (nV + 1) + iv) * 3;
          underLines.push(
            underVerts[a], underVerts[a + 1], underVerts[a + 2],
            underVerts[c], underVerts[c + 1], underVerts[c + 2]
          );
        }
      }

      // Swept triangular outer corner endplate inner dark faces & crimson quad grids at z = +-0.885..0.945
      const epU = 4;
      const epW = 3;
      ([-1, 1] as const).forEach((sSign) => {
        const epBase = underVerts.length / 3;
        for (let iu = 0; iu <= epU; iu++) {
          const u = iu / epU;
          const xTop = -2.165 * (1 - u) + -2.264 * u;
          const yTop = 0.892 * (1 - u) + 0.884 * u;
          const zTop = sSign * 0.884;

          const xBot = -2.175 * (1 - u) + -2.256 * u;
          const yBot = 0.870 * (1 - u) + 0.742 * u;
          const zBot = sSign * (0.942 - 0.022 * u);

          for (let iw = 0; iw <= epW; iw++) {
            const w = iw / epW;
            underVerts.push(
              xTop * (1 - w) + xBot * w,
              yTop * (1 - w) + yBot * w,
              zTop * (1 - w) + zBot * w
            );
          }
        }
        for (let iu = 0; iu < epU; iu++) {
          for (let iw = 0; iw < epW; iw++) {
            const a = epBase + iu * (epW + 1) + iw;
            const b = a + 1;
            const c = a + (epW + 1);
            const d = c + 1;
            underTris.push(a, b, c, b, d, c);
          }
        }
        for (let iu = 0; iu <= epU; iu++) {
          for (let iw = 0; iw < epW; iw++) {
            const a = (epBase + iu * (epW + 1) + iw) * 3;
            const b = (epBase + iu * (epW + 1) + iw + 1) * 3;
            underLines.push(
              underVerts[a], underVerts[a + 1], underVerts[a + 2],
              underVerts[b], underVerts[b + 1], underVerts[b + 2]
            );
          }
        }
        for (let iw = 0; iw <= epW; iw++) {
          for (let iu = 0; iu < epU; iu++) {
            const a = (epBase + iu * (epW + 1) + iw) * 3;
            const c = (epBase + (iu + 1) * (epW + 1) + iw) * 3;
            underLines.push(
              underVerts[a], underVerts[a + 1], underVerts[a + 2],
              underVerts[c], underVerts[c + 1], underVerts[c + 2]
            );
          }
        }
      });

      const underSurfGeo = new THREE.BufferGeometry();
      underSurfGeo.setAttribute('position', new THREE.Float32BufferAttribute(underVerts, 3));
      underSurfGeo.setIndex(underTris);
      underSurfGeo.computeVertexNormals();
      wingAeroUnderlayGroup.add(new THREE.Mesh(underSurfGeo, wingUndersideDarkMat));

      const underWireGeo = new THREE.BufferGeometry();
      underWireGeo.setAttribute('position', new THREE.Float32BufferAttribute(underLines, 3));
      wingAeroUnderlayGroup.add(new THREE.LineSegments(underWireGeo, rearWingWireMat));

      // Solid silver/white metallic trailing fascia bar (visible in Low Drag) & lower clevis bevel lip (visible in High Downforce)
      const lipVerts: number[] = [];
      const lipTris: number[] = [];
      for (let iv = 0; iv <= nV; iv++) {
        const v = (iv / nV) * 2 - 1;
        const [xT, yT, zT] = evalUnderside(1.0, v);
        // Trailing fascia metallic bar (u = 1.0, height 18mm)
        lipVerts.push(xT - 0.008, yT - 0.002, zT, xT - 0.004, yT + 0.017, zT);
      }
      const trailStride = (nV + 1) * 2;
      for (let iv = 0; iv < nV; iv++) {
        const a = iv * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        lipTris.push(a, b, c, b, d, c);
      }
      // Leading clevis lower silver bevel bar (u = 0.0, visible at the top of the struts in High Downforce)
      for (let iv = 0; iv <= nV; iv++) {
        const v = (iv / nV) * 2 - 1;
        const [xL, yL, zL] = evalUnderside(0.0, v);
        lipVerts.push(xL + 0.018, yL - 0.014, zL, xL - 0.004, yL + 0.002, zL);
      }
      for (let iv = 0; iv < nV; iv++) {
        const a = trailStride + iv * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        lipTris.push(a, b, c, b, d, c);
      }
      const lipGeo = new THREE.BufferGeometry();
      lipGeo.setAttribute('position', new THREE.Float32BufferAttribute(lipVerts, 3));
      lipGeo.setIndex(lipTris);
      lipGeo.computeVertexNormals();
      wingAeroUnderlayGroup.add(new THREE.Mesh(lipGeo, bodyShellMat));
    }

    // 3. Twin Articulated Diagonal Linkage Struts & V-Clevis Brackets (z = +-0.35)
    // Emerge from the recessed inner decklid pockets and push the rear piece of the car outside the body
    const rearWingAuxGroup = new THREE.Group();
    rearWingAuxGroup.visible = false;
    chassisGroup.add(rearWingAuxGroup);

    const pylonStrutPairs: {
      mainStrut: THREE.Group;
      clevisHead: THREE.Group;
      zPos: number;
    }[] = [];

    const mainStrutGeo = new THREE.BoxGeometry(0.022, 1.0, 0.016);
    const clevisEarGeo = new THREE.BoxGeometry(0.028, 0.028, 0.008);

    [-0.35, 0.35].forEach((zPos) => {
      const mainStrut = new THREE.Group();
      const sMesh = new THREE.Mesh(mainStrutGeo, carbonMat);
      const sWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(mainStrutGeo),
        rearWingWireMat
      );
      mainStrut.add(sMesh, sWire);
      rearWingAuxGroup.add(mainStrut);

      // Twin-ear vertical clevis bracket at the top of each diagonal strut (matches zoom_low_drag.jpg & zoom_high_downforce.jpg)
      const clevisHead = new THREE.Group();
      [-0.016, 0.016].forEach((dz) => {
        const earMesh = new THREE.Mesh(clevisEarGeo, carbonMat);
        earMesh.position.set(0, 0, dz);
        const earWire = new THREE.LineSegments(
          new THREE.EdgesGeometry(clevisEarGeo),
          rearWingWireMat
        );
        earWire.position.copy(earMesh.position);
        clevisHead.add(earMesh, earWire);
      });
      rearWingAuxGroup.add(clevisHead);

      pylonStrutPairs.push({mainStrut, clevisHead, zPos});
    });

    // Fender Barge-Board Crimson Quad-Wireframe Louver Grid behind front wheel (matches sec_07_car.jpg)
    const bargeFenderQuadGroup = new THREE.Group();
    chassisGroup.add(bargeFenderQuadGroup);
    const bargePanelGeo = new THREE.BoxGeometry(0.38, 0.38, 0.04, 6, 8, 1);
    const bargeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x450505,
      transparent: true,
      opacity: 0.78,
    });
    [-0.985, 0.985].forEach((zSide) => {
      const backing = new THREE.Mesh(bargePanelGeo, bargeGlowMat);
      backing.position.set(0.94, 0.42, zSide);
      backing.rotation.y = zSide < 0 ? -0.06 : 0.06;
      bargeFenderQuadGroup.add(backing);

      const panelWire = new THREE.LineSegments(
        new THREE.WireframeGeometry(bargePanelGeo),
        bargeBoardWireMat
      );
      panelWire.position.copy(backing.position);
      panelWire.rotation.copy(backing.rotation);
      bargeFenderQuadGroup.add(panelWire);
    });

    // Front LED DRL Strip + Upper Slit Projector Headlights + Volumetric Cones (matches sec_10..12)
    const frontLightBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.024, 1.42),
      frontLedMat
    );
    frontLightBar.position.set(2.18, 0.42, 0);
    chassisGroup.add(frontLightBar);

    const upperSlitLightsGroup = new THREE.Group();
    [-0.71, 0.71].forEach((zPos) => {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.028, 0.18),
        frontLedMat
      );
      slit.position.set(1.92, 0.57, zPos);
      slit.rotation.y = zPos < 0 ? 0.32 : -0.32;
      slit.rotation.z = -0.18;
      upperSlitLightsGroup.add(slit);
    });
    chassisGroup.add(upperSlitLightsGroup);

    const headlightBeamMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const headlightBeamsGroup = new THREE.Group();
    [-0.62, 0.62].forEach((zPos) => {
      const coneGeo = new THREE.ConeGeometry(0.38, 2.8, 20, 1, true);
      coneGeo.rotateZ(Math.PI / 2);
      const beam = new THREE.Mesh(coneGeo, headlightBeamMat);
      beam.position.set(3.45, 0.38, zPos);
      beam.rotation.z = -0.04;
      headlightBeamsGroup.add(beam);
    });
    chassisGroup.add(headlightBeamsGroup);

    // Hood Vent Internal Crimson Quad-Wireframe Intake Slot (matches sec_09_car.jpg)
    const hoodVentGlowMat = new THREE.MeshBasicMaterial({
      color: 0x3b0404,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const hoodVentSlotGeo = new THREE.PlaneGeometry(0.16, 0.92, 3, 12);
    const hoodVentGlow = new THREE.Mesh(hoodVentSlotGeo, hoodVentGlowMat);
    hoodVentGlow.rotation.x = -Math.PI / 2;
    hoodVentGlow.position.set(-0.04, -0.01, 0);
    hoodVentGroup.add(hoodVentGlow);

    const hoodVentGridWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(hoodVentSlotGeo),
      hoodVentWireMat
    );
    hoodVentGridWire.rotation.x = -Math.PI / 2;
    hoodVentGridWire.position.set(-0.04, -0.008, 0);
    hoodVentGroup.add(hoodVentGridWire);

    // Multi-Blade Crimson Rear LED Tail Light Visor Bars recessed at x = -2.23, y = 0.77..0.85 (sec_03..05 & sec_31..33)
    const rearTailLight = new THREE.Group();
    [0.775, 0.802, 0.828, 0.852].forEach((yBar) => {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.009, 1.68),
        crimsonEmissiveMat
      );
      blade.position.set(-2.228, yBar, 0);
      rearTailLight.add(blade);
    });
    chassisGroup.add(rearTailLight);

    // Recessed Internal Impeller Rotors & Cold-Gas Plumes inside the 8 Wireframe Diffuser Thrusters
    // (Centered at x = -1.945 inside the lower diffuser fan tunnels so nothing protrudes outside the car)
    const thrusterNozzlesGroup = new THREE.Group();
    thrusterNozzlesGroup.position.set(-1.945, 0.34, 0);
    chassisGroup.add(thrusterNozzlesGroup);

    const fanRotors: THREE.Object3D[] = [];
    const lowerZOffsets = [-0.455, -0.158, 0.158, 0.455];
    lowerZOffsets.forEach((zOff) => {
      const rotor = new THREE.Group();
      rotor.position.set(0.0, 0.0, zOff);
      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.052, 0.016),
          goldThrusterMat
        );
        blade.rotation.x = (b * Math.PI * 2) / 5;
        rotor.add(blade);
      }
      thrusterNozzlesGroup.add(rotor);
      fanRotors.push(rotor);
    });

    // Cold-Gas Thruster Plumes (when firing Boost Ready)
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const thrusterPlumesGroup = new THREE.Group();
    [-0.388, -0.148, 0.148, 0.388].forEach((zOff) => {
      const pGeo = new THREE.ConeGeometry(0.08, 1.15, 14, 1, true);
      pGeo.rotateZ(-Math.PI / 2);
      const pMesh = new THREE.Mesh(pGeo, plumeMat);
      pMesh.position.set(-0.68, 0.14, zOff);
      thrusterPlumesGroup.add(pMesh);
    });
    thrusterNozzlesGroup.add(thrusterPlumesGroup);

    // X-Ray Cutaway 1 — Golden Structural Battery Pack, Front Power Electronics & HV Harness (sec_23_car.jpg & ui_3.jpg)
    const batteryXrayGroup = new THREE.Group();
    chassisGroup.add(batteryXrayGroup);

    const mainBatterySlab = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.19, 1.18),
      goldXrayBatteryMat
    );
    mainBatterySlab.position.set(-0.05, 0.26, 0);
    batteryXrayGroup.add(mainBatterySlab);

    const rearDriveInverter = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.86),
      goldXrayBatteryMat
    );
    rearDriveInverter.position.set(-0.62, 0.42, 0);
    batteryXrayGroup.add(rearDriveInverter);

    // Sculpted Front Dash / Frunk Power Electronics & Steering Column Assembly (sec_23_car.jpg)
    const frontFrunkModule = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 18, 14),
      goldXrayBatteryMat
    );
    frontFrunkModule.scale.set(1.45, 0.68, 0.95);
    frontFrunkModule.position.set(0.68, 0.64, 0);
    frontFrunkModule.rotation.z = -0.18;
    batteryXrayGroup.add(frontFrunkModule);

    const steeringColumnTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.42, 10),
      goldXrayBatteryMat
    );
    steeringColumnTube.position.set(0.54, 0.54, -0.22);
    steeringColumnTube.rotation.z = 0.65;
    batteryXrayGroup.add(steeringColumnTube);

    const hvCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.46, -0.25),
      new THREE.Vector3(-0.98, 0.62, -0.38),
      new THREE.Vector3(-1.38, 0.58, -0.52),
      new THREE.Vector3(-1.66, 0.72, -0.58),
    ]);
    const hvCableMesh = new THREE.Mesh(
      new THREE.TubeGeometry(hvCableCurve, 24, 0.026, 8, false),
      goldXrayBatteryMat
    );
    batteryXrayGroup.add(hvCableMesh);

    // X-Ray Cutaway 2 — SpaceX COPV Tank, Front/Rear Motors, Double-Wishbone Suspension & Brakes (sec_28_car.jpg & sec_32_car.jpg)
    const dynamicsXrayGroup = new THREE.Group();
    chassisGroup.add(dynamicsXrayGroup);

    // Large Golden Spherical SpaceX COPV Pressure Vessel behind cabin (sec_32_car.jpg)
    const copvTank = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 28, 20),
      goldXrayInternalMat
    );
    copvTank.scale.set(1.22, 0.92, 1.28);
    copvTank.position.set(-0.86, 0.68, 0);
    dynamicsXrayGroup.add(copvTank);

    // Front Dual-Motor, Subframe & Cooling/Steering Rack (sec_28_car.jpg)
    const frontMotorUnit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.58, 16),
      goldXrayInternalMat
    );
    frontMotorUnit.rotation.x = Math.PI / 2;
    frontMotorUnit.position.set(1.46, 0.34, 0);
    dynamicsXrayGroup.add(frontMotorUnit);

    const frontCoolingManifold = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.22, 0.88),
      goldXrayInternalMat
    );
    frontCoolingManifold.position.set(1.68, 0.44, 0);
    dynamicsXrayGroup.add(frontCoolingManifold);

    const frontSubframeTubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.15, 0.22, -0.52),
      new THREE.Vector3(1.75, 0.2, -0.46),
      new THREE.Vector3(1.92, 0.24, 0),
      new THREE.Vector3(1.75, 0.2, 0.46),
      new THREE.Vector3(1.15, 0.22, 0.52),
    ]);
    const frontSubframeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(frontSubframeTubeCurve, 24, 0.028, 8, false),
      goldXrayInternalMat
    );
    dynamicsXrayGroup.add(frontSubframeMesh);

    // Golden Ventilated Brake Rotors, Calipers, Double Wishbones & Coilover Dampers at all 4 wheels
    Object.values(wheelCenters).forEach(([wx, wy, wz]) => {
      const sideSign = wz >= 0 ? 1 : -1;

      // Golden Brake Disc Rotor
      const brakeDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.21, 0.036, 20),
        goldXrayInternalMat
      );
      brakeDisc.rotation.x = Math.PI / 2;
      brakeDisc.position.set(wx, wy, wz * 0.9);
      dynamicsXrayGroup.add(brakeDisc);

      // Golden 6-Piston Brake Caliper
      const caliper = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.18, 0.075),
        goldXrayInternalMat
      );
      caliper.position.set(wx - 0.14, wy + 0.05, wz * 0.9);
      dynamicsXrayGroup.add(caliper);

      // Angled Coilover Damper
      const damper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.44, 12),
        goldXrayInternalMat
      );
      damper.position.set(wx, wy + 0.14, wz * 0.7);
      damper.rotation.x = sideSign * 0.26;
      dynamicsXrayGroup.add(damper);

      // Upper & Lower Wishbone Arms
      [-0.08, 0.08].forEach((yOff) => {
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.025, 0.34),
          goldXrayInternalMat
        );
        arm.position.set(wx, wy + yOff, wz * 0.62);
        dynamicsXrayGroup.add(arm);
      });
    });

    const drivetrainSpine = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.16, 0.56),
      goldXrayInternalMat
    );
    drivetrainSpine.position.set(0.0, 0.32, 0);
    dynamicsXrayGroup.add(drivetrainSpine);

    // Wind-Tunnel Aerodynamic Streamlines (sec_01.jpg & sec_02.jpg)
    const streamlinesGroup = new THREE.Group();
    roadsterRoot.add(streamlinesGroup);

    const streamLineMaterials: THREE.LineBasicMaterial[] = [];
    const streamZOffsets = [-0.72, -0.52, -0.34, -0.16, 0, 0.16, 0.34, 0.52, 0.72];

    streamZOffsets.forEach((zOff, i) => {
      const isCenter = Math.abs(zOff) < 0.38;
      const pts = [
        new THREE.Vector3(3.8, 0.26, zOff * 0.85),
        new THREE.Vector3(2.25, 0.38, zOff * 0.92),
        new THREE.Vector3(1.15, isCenter ? 0.86 : 0.62, zOff),
        new THREE.Vector3(0.0, isCenter ? 1.28 : 0.82, zOff * 1.04),
        new THREE.Vector3(-1.35, isCenter ? 1.12 : 0.76, zOff * 0.98),
        new THREE.Vector3(-2.25, isCenter ? 0.96 : 0.64, zOff * 0.92),
        new THREE.Vector3(-4.5, isCenter ? 0.72 : 0.46, zOff * 1.18),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const isRedLine = i % 3 === 1;
      const mat = new THREE.LineBasicMaterial({
        color: isRedLine ? 0xff2a2a : 0xf8fafc,
        transparent: true,
        opacity: 0.0,
      });
      streamLineMaterials.push(mat);
      const line = new THREE.Line(lineGeo, mat);
      streamlinesGroup.add(line);
    });

    // Interactive Pointer Orbit & Wheel Zoom State
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let userAzimuthOffset = 0;
    let userElevationOffset = 0;
    let userZoomScale = 1.0;
    let lastCameraPreset: CameraPreset = stateRef.current.cameraPreset;
    let lastWireframeMode = stateRef.current.wireframeRenderMode;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      userAzimuthOffset -= dx * 0.0065;
      userElevationOffset = THREE.MathUtils.clamp(
        userElevationOffset + dy * 0.005,
        -0.45,
        0.65
      );
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      userZoomScale = THREE.MathUtils.clamp(
        userZoomScale + e.deltaY * 0.0008,
        0.62,
        1.55
      );
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, {passive: true});

    // Damped Animation State inside Render Loop
    const clock = new THREE.Clock();
    const currentCamPos = new THREE.Vector3(initCam.pos[0], initCam.pos[1], initCam.pos[2]);
    const currentLookAt = new THREE.Vector3(
      initCam.lookAt[0],
      initCam.lookAt[1],
      initCam.lookAt[2]
    );
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    const orbitOffsetVec = new THREE.Vector3();
    const spherical = new THREE.Spherical();

    const initTargets = computeTargetCarAnimations(stateRef.current);
    let curRearWing = initTargets.rearWingDeploy;
    let curFrontWing = initTargets.frontWingDeploy;
    let curBarge = initTargets.bargeBoardDeploy;
    let curHoodVent = initTargets.hoodVentOpen;
    let curRideHeight = initTargets.rideHeightOffset;
    let curHeadlight = initTargets.headlightIntensity;
    let curStream = initTargets.airflowStreamIntensity;
    let curRedWake = initTargets.rearRedWakeIntensity;
    let curXrayDrivetrain = initTargets.xrayDrivetrainIntensity;
    let curXrayBattery = initTargets.xrayBatteryIntensity;
    let curPlume = initTargets.thrusterPlumeIntensity;
    let curSilhouette = initTargets.silhouetteDarkness;

    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 70);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 70);
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth || 1440;
      const h = container.clientHeight || window.innerHeight || 900;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const s = stateRef.current;
      const isStudioMode = s.wireframeRenderMode === 'studio';
      const targets = computeTargetCarAnimations(s);
      const modeChanged = s.wireframeRenderMode !== lastWireframeMode;
      if (modeChanged) {
        lastWireframeMode = s.wireframeRenderMode;
      }

      // Reset orbit offsets when cameraPreset changes
      if (s.cameraPreset !== lastCameraPreset || modeChanged) {
        lastCameraPreset = s.cameraPreset;
        userAzimuthOffset = 0;
        userElevationOffset = 0;
        userZoomScale = 1.0;
      }

      const camSpec = CAMERA_TARGETS[s.cameraPreset] || CAMERA_TARGETS.rearWing34;
      if (Math.abs(camera.fov - camSpec.fov) > 0.05) {
        camera.fov = camSpec.fov;
        camera.updateProjectionMatrix();
      }
      targetLookAt.set(camSpec.lookAt[0], camSpec.lookAt[1], camSpec.lookAt[2]);

      orbitOffsetVec.set(
        camSpec.pos[0] - camSpec.lookAt[0],
        camSpec.pos[1] - camSpec.lookAt[1],
        camSpec.pos[2] - camSpec.lookAt[2]
      );
      spherical.setFromVector3(orbitOffsetVec);
      spherical.theta += userAzimuthOffset;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi - userElevationOffset,
        0.18,
        Math.PI * 0.48
      );
      spherical.radius *= userZoomScale;
      orbitOffsetVec.setFromSpherical(spherical);
      targetCamPos.copy(targetLookAt).add(orbitOffsetVec);

      const dampFactor = modeChanged
        ? 1.0
        : Math.min(1, Math.max(0.24, 1 - Math.exp(-8.0 * dt)));
      currentCamPos.lerp(targetCamPos, dampFactor);
      currentLookAt.lerp(targetLookAt, dampFactor);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // Smoothly damp all car hardware animations
      curRearWing = THREE.MathUtils.lerp(curRearWing, targets.rearWingDeploy, dampFactor);
      curFrontWing = THREE.MathUtils.lerp(curFrontWing, targets.frontWingDeploy, dampFactor);
      curBarge = THREE.MathUtils.lerp(curBarge, targets.bargeBoardDeploy, dampFactor);
      curHoodVent = THREE.MathUtils.lerp(curHoodVent, targets.hoodVentOpen, dampFactor);
      curRideHeight = THREE.MathUtils.lerp(curRideHeight, targets.rideHeightOffset, dampFactor);
      curHeadlight = THREE.MathUtils.lerp(curHeadlight, targets.headlightIntensity, dampFactor);
      curStream = THREE.MathUtils.lerp(curStream, targets.airflowStreamIntensity, dampFactor);
      curRedWake = THREE.MathUtils.lerp(curRedWake, targets.rearRedWakeIntensity, dampFactor);
      curXrayDrivetrain = THREE.MathUtils.lerp(
        curXrayDrivetrain,
        targets.xrayDrivetrainIntensity,
        dampFactor
      );
      curXrayBattery = THREE.MathUtils.lerp(
        curXrayBattery,
        targets.xrayBatteryIntensity,
        dampFactor
      );
      curPlume = THREE.MathUtils.lerp(curPlume, targets.thrusterPlumeIntensity, dampFactor);
      curSilhouette = THREE.MathUtils.lerp(curSilhouette, targets.silhouetteDarkness, dampFactor);

      // Switch Studio Quad-Wireframe Mode (Mode 5 / image.png) vs Cockpit Dual-Pass Mode
      scene.background = isStudioMode ? bgStudio : bgCockpit;
      fog.color.setHex(isStudioMode ? 0xd8dade : 0x000000);
      fog.density = isStudioMode ? 0.015 : 0.048;
      floorDots.visible = !isStudioMode;
      studioFloorGroup.visible = isStudioMode;
      rearRedGlow.intensity = isStudioMode ? 0.0 : 3.0;
      thrusterGoldLight.intensity = isStudioMode ? 0.4 : 2.4;

      // Apply 1: Two-Stage Rear Wing Kinematics (Stowed -> Low Drag -> High Downforce)
      // Closed (Stowed) = 100% seamless car body. Opening moves the back piece of the car outside the body
      // on diagonal struts (Low Drag = horizontal leveled bar; High Downforce = steep 38-deg pitch exposing 4x16 underside grid)
      const effectiveRearWing = isStudioMode && s.activeHotspot !== 'rearWing' ? 0 : curRearWing;
      const tLift = Math.min(1, effectiveRearWing / 0.48);
      const tHigh = Math.max(0, (effectiveRearWing - 0.48) / 0.52);
      const wingLiftY = tLift * 0.082 - tHigh * 0.004;
      const wingShiftX = -tLift * 0.068 - tHigh * 0.014;
      const wingPitchZ = -tLift * 0.165 - tHigh * 0.495;

      rearWingGroup.position.set(
        rearWingBaseCenter[0] + wingShiftX,
        rearWingBaseCenter[1] + wingLiftY,
        rearWingBaseCenter[2]
      );
      rearWingGroup.rotation.z = wingPitchZ;

      const isWingDeployed = effectiveRearWing > 0.01;
      recessedDecklidGroup.visible = isWingDeployed;
      wingAeroUnderlayGroup.visible = isWingDeployed;
      rearWingAuxGroup.visible = isWingDeployed;

      if (isWingDeployed) {
        const xBase = -2.015;
        const yBase = 0.888;
        const xTop = -1.965 + wingShiftX;
        const yTop = 0.924 + wingLiftY;
        const dx = xTop - xBase;
        const dy = yTop - yBase;
        const strutLen = Math.max(0.02, Math.hypot(dx, dy));
        const strutAngle = Math.atan2(-dx, dy);

        pylonStrutPairs.forEach(({mainStrut, clevisHead, zPos}) => {
          mainStrut.position.set((xBase + xTop) * 0.5, (yBase + yTop) * 0.5, zPos);
          mainStrut.scale.set(1, strutLen, 1);
          mainStrut.rotation.z = strutAngle;

          clevisHead.position.set(xTop, yTop, zPos);
          clevisHead.rotation.z = wingPitchZ * 0.35;
        });
      }

      // Apply 2: Front Splitter Deployment & Pitch around exact front_splitter centroid
      const splitterOffset =
        isStudioMode && s.activeHotspot === 'none'
          ? 0
          : Math.max(0, curFrontWing - 0.25) / 0.75;
      frontSplitterGroup.position.set(
        frontSplitterBaseCenter[0] + splitterOffset * 0.04,
        frontSplitterBaseCenter[1] - splitterOffset * 0.01,
        frontSplitterBaseCenter[2]
      );
      frontSplitterGroup.rotation.z = splitterOffset * 0.06;

      // Apply 3: Side Barge Boards Outward Deployment & Fender Quad Grid (sec_06 & sec_07)
      const effectiveBarge =
        s.activeHotspot === 'bargeBoard' && curBarge > 0.05 ? curBarge : 0;
      leftBargeBoardGroup.position.set(
        leftBargeBaseCenter[0],
        leftBargeBaseCenter[1],
        leftBargeBaseCenter[2] - effectiveBarge * 0.045
      );
      leftBargeBoardGroup.rotation.y = -effectiveBarge * 0.09;

      rightBargeBoardGroup.position.set(
        rightBargeBaseCenter[0],
        rightBargeBaseCenter[1],
        rightBargeBaseCenter[2] + effectiveBarge * 0.045
      );
      rightBargeBoardGroup.rotation.y = effectiveBarge * 0.09;
      bargeFenderQuadGroup.visible = !isStudioMode && effectiveBarge > 0.05;

      // Apply 4: Front Hood Vent Open/Close around exact hood_vent centroid (sec_08 & sec_09)
      const effectiveHoodVent =
        isStudioMode && s.activeHotspot !== 'hoodVent' ? 0 : curHoodVent;
      hoodVentGroup.position.set(
        hoodVentBaseCenter[0],
        hoodVentBaseCenter[1] + effectiveHoodVent * 0.032,
        hoodVentBaseCenter[2]
      );
      hoodVentGroup.rotation.z = effectiveHoodVent * 0.3;
      hoodVentGlow.visible = !isStudioMode && effectiveHoodVent > 0.05;
      hoodVentGridWire.visible = !isStudioMode && effectiveHoodVent > 0.05;
      hoodVentGlowMat.opacity = 0.25 + effectiveHoodVent * 0.7;

      // Apply 5: Suspension Ride Height (Standard vs Low in sec_28..29 and sec_32..33)
      chassisGroup.position.y = isStudioMode ? 0 : curRideHeight * 0.38;

      // Apply 6: Exterior Headlights (DRL vs On/Auto in sec_10, sec_11, sec_12)
      frontLightBar.visible = !isStudioMode && curHeadlight > 0.05;
      upperSlitLightsGroup.visible = !isStudioMode && curHeadlight > 0.5;
      headlightBeamMat.opacity =
        !isStudioMode && curHeadlight > 0.5 ? curHeadlight * 0.22 : 0.0;

      // Apply 7: Materials & Wireframe Colors for Studio Mode 5 vs Cockpit Dual-Pass
      const anyXray = Math.max(curXrayDrivetrain, curXrayBattery);
      const needTransparent = anyXray > 0.02;
      if (bodyShellMat.transparent !== needTransparent) {
        bodyShellMat.transparent = needTransparent;
        bodyShellMat.needsUpdate = true;
      }
      if (canopyGlassMat.transparent !== needTransparent) {
        canopyGlassMat.transparent = needTransparent;
        canopyGlassMat.needsUpdate = true;
      }

      if (isStudioMode) {
        // Sketchfab RenderingWireframe: 5 (matte white clay + dark charcoal quad wireframe matching image.png)
        bodyShellMat.color.setHex(0xf4f5f7);
        bodyShellMat.metalness = 0.05;
        bodyShellMat.roughness = 0.82;
        bodyShellMat.opacity = needTransparent ? THREE.MathUtils.lerp(1.0, 0.28, anyXray) : 1.0;

        canopyGlassMat.color.setHex(0xf1f3f5);
        canopyGlassMat.metalness = 0.08;
        canopyGlassMat.roughness = 0.75;
        canopyGlassMat.opacity = needTransparent ? THREE.MathUtils.lerp(1.0, 0.32, anyXray) : 1.0;

        wheelSurfaceMat.color.setHex(0xf0f1f4);
        wheelSurfaceMat.metalness = 0.08;
        wheelSurfaceMat.roughness = 0.78;

        activeAeroSurfaceMat.color.setHex(0xf4f5f7);
        activeAeroSurfaceMat.metalness = 0.06;
        activeAeroSurfaceMat.roughness = 0.8;

        headlightSurfaceMat.color.setHex(0xf4f5f7);
        headlightSurfaceMat.emissiveIntensity =
          curHeadlight > 0.5 && s.activeHotspot === 'exteriorLights' ? 0.35 : 0.0;

        taillightSurfaceMat.color.setHex(0xf4f5f7);
        taillightSurfaceMat.emissiveIntensity = 0.0;

        goldThrusterMat.color.setHex(0xf0f1f4);
        goldThrusterMat.metalness = 0.08;
        goldThrusterMat.roughness = 0.78;
        goldThrusterMat.emissiveIntensity = 0.0;
        thrusterWireMat.color.setHex(0x52565e);
        thrusterWireMat.opacity = 0.62;
        thrusterCreaseMat.color.setHex(0x1f2228);
        thrusterCreaseMat.opacity = 0.88;

        bodyCreaseMat.color.setHex(0x1f2228);
        bodyCreaseMat.opacity = 0.88;
        bodyWireframeMat.color.setHex(0x52565e);
        bodyWireframeMat.opacity = 0.56;
        canopyWireframeMat.color.setHex(0x52565e);
        canopyWireframeMat.opacity = 0.54;
        wheelWireframeMat.color.setHex(0x3f434a);
        wheelWireframeMat.opacity = 0.65;

        rearWingWireMat.color.setHex(s.activeHotspot === 'rearWing' ? 0xd91b1b : 0x52565e);
        rearWingWireMat.opacity = s.activeHotspot === 'rearWing' ? 0.82 : 0.56;

        rearWingBodySurfMat.color.copy(bodyShellMat.color);
        rearWingBodySurfMat.metalness = bodyShellMat.metalness;
        rearWingBodySurfMat.roughness = bodyShellMat.roughness;
        rearWingBodyGridMat.color.setHex(
          s.activeHotspot === 'rearWing' && effectiveRearWing > 0.02 ? 0xd91b1b : 0x52565e
        );
        rearWingBodyGridMat.opacity =
          s.activeHotspot === 'rearWing' && effectiveRearWing > 0.02 ? 0.82 : 0.56;
        rearWingBodyCreaseMat.color.setHex(
          s.activeHotspot === 'rearWing' && effectiveRearWing > 0.02 ? 0xd91b1b : 0x1f2228
        );
        rearWingBodyCreaseMat.opacity = 0.88;

        frontSplitterWireMat.color.setHex(0x52565e);
        frontSplitterWireMat.opacity = 0.56;

        bargeBoardWireMat.color.setHex(s.activeHotspot === 'bargeBoard' ? 0xd91b1b : 0x52565e);
        bargeBoardWireMat.opacity = s.activeHotspot === 'bargeBoard' ? 0.82 : 0.56;

        hoodVentWireMat.color.setHex(s.activeHotspot === 'hoodVent' ? 0xd91b1b : 0x52565e);
        hoodVentWireMat.opacity = s.activeHotspot === 'hoodVent' ? 0.82 : 0.56;

        lightsWireMat.color.setHex(s.activeHotspot === 'exteriorLights' ? 0xd91b1b : 0x1f2228);
        lightsWireMat.opacity = 0.86;
      } else {
        // Cockpit Dual-Pass Mode (dark metallic body + crisp quad-wireframe + glowing red aero zones)
        bodyShellMat.color.setHex(curSilhouette > 0.5 ? 0x08090c : 0x1c1f26);
        bodyShellMat.metalness = 0.75;
        bodyShellMat.roughness = 0.25;
        bodyShellMat.opacity = needTransparent ? THREE.MathUtils.lerp(0.95, 0.22, anyXray) : 1.0;

        canopyGlassMat.color.setHex(0x0b0e14);
        canopyGlassMat.metalness = 0.4;
        canopyGlassMat.roughness = 0.14;
        canopyGlassMat.opacity = needTransparent ? THREE.MathUtils.lerp(0.9, 0.28, anyXray) : 1.0;

        wheelSurfaceMat.color.setHex(0x161920);
        wheelSurfaceMat.metalness = 0.55;
        wheelSurfaceMat.roughness = 0.36;

        activeAeroSurfaceMat.color.setHex(0x222630);
        activeAeroSurfaceMat.metalness = 0.68;
        activeAeroSurfaceMat.roughness = 0.28;

        headlightSurfaceMat.color.setHex(curSilhouette > 0.5 ? 0x08090c : 0x1c1f26);
        headlightSurfaceMat.emissiveIntensity = 0.0;

        taillightSurfaceMat.color.setHex(0xff1e1e);
        taillightSurfaceMat.emissiveIntensity = 0.95;

        goldThrusterMat.color.setHex(0xd99b26);
        goldThrusterMat.metalness = 0.78;
        goldThrusterMat.roughness = 0.26;
        goldThrusterMat.emissiveIntensity =
          0.52 + targets.thrusterNozzleGlow * 0.55 + curPlume * 1.5;
        thrusterWireMat.color.setHex(0xfde68a);
        thrusterWireMat.opacity = 0.86;
        thrusterCreaseMat.color.setHex(0xfbbf24);
        thrusterCreaseMat.opacity = 0.95;

        bodyCreaseMat.color.setHex(0xcbd5e1);
        bodyCreaseMat.opacity = THREE.MathUtils.lerp(0.66, 0.85, anyXray);
        bodyWireframeMat.color.setHex(0x94a3b8);
        bodyWireframeMat.opacity = THREE.MathUtils.lerp(0.32, 0.58, anyXray);
        canopyWireframeMat.color.setHex(0x94a3b8);
        canopyWireframeMat.opacity = 0.32;
        wheelWireframeMat.color.setHex(0x94a3b8);
        wheelWireframeMat.opacity = 0.46;

        rearWingWireMat.color.setHex(
          s.activeHotspot === 'rearWing' || curRearWing > 0.05 ? 0xff1e1e : 0x94a3b8
        );
        rearWingWireMat.opacity =
          s.activeHotspot === 'rearWing' || curRearWing > 0.05 ? 0.95 : 0.42;

        // When Stowed (effectiveRearWing <= 0.01): 100% identical to bodyShellMat / bodyWireframeMat / bodyCreaseMat.
        // When High Downforce (tHigh > 0.1): transitions to dark charcoal + crimson active-aero wireframe.
        rearWingBodySurfMat.color.setHex(
          tHigh > 0.2 ? 0x110304 : curSilhouette > 0.5 ? 0x08090c : 0x1c1f26
        );
        rearWingBodySurfMat.metalness = tHigh > 0.2 ? 0.48 : 0.75;
        rearWingBodySurfMat.roughness = tHigh > 0.2 ? 0.52 : 0.25;
        rearWingBodySurfMat.opacity = bodyShellMat.opacity;

        rearWingBodyGridMat.color.setHex(tHigh > 0.15 ? 0xff1e1e : 0x94a3b8);
        rearWingBodyGridMat.opacity =
          tHigh > 0.15 ? 0.88 : THREE.MathUtils.lerp(0.32, 0.58, anyXray);

        rearWingBodyCreaseMat.color.setHex(
          tHigh > 0.15 ? 0xff2e2e : effectiveRearWing > 0.02 ? 0xe2e8f0 : 0xcbd5e1
        );
        rearWingBodyCreaseMat.opacity =
          tHigh > 0.15 ? 0.95 : THREE.MathUtils.lerp(0.66, 0.85, anyXray);

        frontSplitterWireMat.color.setHex(splitterOffset > 0.1 ? 0xff1e1e : 0x94a3b8);
        frontSplitterWireMat.opacity = splitterOffset > 0.1 ? 0.92 : 0.42;
        bargeBoardWireMat.color.setHex(
          s.activeHotspot === 'bargeBoard' && curBarge > 0.05 ? 0xff1e1e : 0x94a3b8
        );
        bargeBoardWireMat.opacity =
          s.activeHotspot === 'bargeBoard' && curBarge > 0.05 ? 0.95 : 0.36;
        hoodVentWireMat.color.setHex(
          s.activeHotspot === 'hoodVent' || curHoodVent > 0.05 ? 0xff1e1e : 0x94a3b8
        );
        hoodVentWireMat.opacity =
          s.activeHotspot === 'hoodVent' || curHoodVent > 0.05 ? 0.95 : 0.42;
        lightsWireMat.color.setHex(
          s.activeHotspot === 'exteriorLights' ? 0xff1e1e : 0xe2e8f0
        );
        lightsWireMat.opacity = 0.82;
      }

      goldXrayInternalMat.opacity = curXrayDrivetrain * 0.92;
      dynamicsXrayGroup.visible = curXrayDrivetrain > 0.02;
      goldXrayBatteryMat.opacity = curXrayBattery * 0.94;
      batteryXrayGroup.visible = curXrayBattery > 0.02;
      rearTailLight.visible = !isStudioMode;
      thrusterNozzlesGroup.visible = !isStudioMode || curPlume > 0.05;

      // Apply 8: SpaceX Cold-Gas Plume
      plumeMat.opacity = curPlume * (0.65 + 0.25 * Math.sin(elapsed * 45));
      thrusterPlumesGroup.scale.set(
        1 + curPlume * 0.35 * Math.sin(elapsed * 38),
        1,
        1
      );

      // Spin underbody fans while keeping watertight wheel-arch mesh aligned
      fanRotors.forEach((r) => {
        r.rotation.x += dt * (4 + targets.fanSpinIntensity * 28);
      });
      wheelGroups.forEach((wg) => {
        wg.rotation.z = 0;
      });

      // Apply 9: Wind-Tunnel Streamlines
      streamlinesGroup.visible = curStream > 0.02;
      streamLineMaterials.forEach((mat, idx) => {
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 4.5 + idx * 0.7);
        if (isStudioMode && idx % 3 !== 1) {
          mat.color.setHex(0x1e293b);
        } else if (idx % 3 !== 1) {
          mat.color.setHex(0xf8fafc);
        }
        mat.opacity = curStream * 0.82 * pulse;
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
    };
  }, []);

  const isHomeInteractive = state.primaryTab === 'Home' && state.trackModeView === 'Off';

  // Camera-aware 7-diamond hotspot coordinates matching sec_01.jpg, sec_03..12.jpg
  const hotspotNodes: {
    id: string;
    label: string;
    left: string;
    top: string;
    hotspot: HotspotPopupId;
    preset: CameraPreset;
  }[] = (() => {
    if (state.cameraPreset === 'sideBarge') {
      // sec_06.jpg & sec_07.jpg
      return [
        {id: 'frontSplitter', label: 'Inspect Front Splitter', left: '13.6%', top: '57.2%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'headlight', label: 'Inspect Exterior Lights Hotspot', left: '20.5%', top: '52.2%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'hoodVent', label: 'Inspect Hood Vent Hotspot', left: '25.5%', top: '44.0%', hotspot: 'hoodVent', preset: 'frontHood'},
        {id: 'bargeBoard', label: 'Inspect Barge Board Hotspot', left: '42.1%', top: '51.8%', hotspot: 'bargeBoard', preset: 'sideBarge'},
        {id: 'rearWheel', label: 'Inspect Rear Wheel Aero', left: '77.8%', top: '54.2%', hotspot: 'rearWing', preset: 'rearWing34'},
        {id: 'rearWing', label: 'Inspect Rear Wing Hotspot', left: '82.4%', top: '35.2%', hotspot: 'rearWing', preset: 'rearWing34'},
        {id: 'tailLight', label: 'Inspect Rear Thrusters', left: '82.6%', top: '41.8%', hotspot: 'rearWing', preset: 'rearAero'},
      ];
    }
    if (state.cameraPreset === 'frontHood') {
      // sec_08.jpg & sec_09.jpg
      return [
        {id: 'frontSplitter', label: 'Inspect Front Splitter', left: '38.6%', top: '71.0%', hotspot: 'hoodVent', preset: 'frontHood'},
        {id: 'hoodVent', label: 'Inspect Hood Vent Hotspot', left: '43.4%', top: '49.8%', hotspot: 'hoodVent', preset: 'frontHood'},
        {id: 'exteriorLights', label: 'Inspect Exterior Lights Hotspot', left: '57.6%', top: '62.5%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'bargeBoard', label: 'Inspect Barge Board Hotspot', left: '64.2%', top: '54.8%', hotspot: 'bargeBoard', preset: 'sideBarge'},
        {id: 'roofCanopy', label: 'Inspect Canopy Aero', left: '59.5%', top: '30.2%', hotspot: 'hoodVent', preset: 'sideAero'},
        {id: 'rearWing', label: 'Inspect Rear Wing Hotspot', left: '69.2%', top: '37.2%', hotspot: 'rearWing', preset: 'rearWing34'},
        {id: 'rearWheel', label: 'Inspect Rear Diffuser', left: '71.6%', top: '49.0%', hotspot: 'rearWing', preset: 'rearWing34'},
      ];
    }
    if (state.cameraPreset === 'frontLights') {
      // sec_10.jpg .. sec_12.jpg
      return [
        {id: 'frontSplitter', label: 'Inspect Front Splitter', left: '22.9%', top: '52.2%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'hoodVent', label: 'Inspect Hood Vent Hotspot', left: '33.3%', top: '33.2%', hotspot: 'hoodVent', preset: 'frontHood'},
        {id: 'exteriorLights', label: 'Inspect Exterior Lights Hotspot', left: '42.1%', top: '44.5%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'bargeBoard', label: 'Inspect Barge Board Hotspot', left: '58.4%', top: '41.6%', hotspot: 'bargeBoard', preset: 'sideBarge'},
        {id: 'roofCanopy', label: 'Inspect Canopy Aero', left: '69.2%', top: '22.4%', hotspot: 'hoodVent', preset: 'sideAero'},
        {id: 'rearWing', label: 'Inspect Rear Wing Hotspot', left: '77.4%', top: '28.6%', hotspot: 'rearWing', preset: 'rearWing34'},
        {id: 'rearWheel', label: 'Inspect Rear Wheel Aero', left: '78.1%', top: '41.4%', hotspot: 'rearWing', preset: 'rearWing34'},
      ];
    }
    if (state.cameraPreset === 'sideAero') {
      // sec_01.jpg
      return [
        {id: 'headlight', label: 'Inspect Exterior Lights Hotspot', left: '34.8%', top: '48.4%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'frontSplitter', label: 'Inspect Front Splitter', left: '35.4%', top: '51.4%', hotspot: 'exteriorLights', preset: 'frontLights'},
        {id: 'hoodVent', label: 'Inspect Hood Vent Hotspot', left: '40.0%', top: '44.2%', hotspot: 'hoodVent', preset: 'frontHood'},
        {id: 'bargeBoard', label: 'Inspect Barge Board Hotspot', left: '44.1%', top: '47.6%', hotspot: 'bargeBoard', preset: 'sideBarge'},
        {id: 'rearWheel', label: 'Inspect Rear Wheel Aero', left: '61.3%', top: '47.8%', hotspot: 'rearWing', preset: 'rearWing34'},
        {id: 'tailLight', label: 'Inspect Rear Tail Light', left: '66.3%', top: '39.6%', hotspot: 'rearWing', preset: 'rearAero'},
        {id: 'rearWing', label: 'Inspect Rear Wing Hotspot', left: '69.1%', top: '35.6%', hotspot: 'rearWing', preset: 'rearWing34'},
      ];
    }
    // Default: rearWing34 (sec_03.jpg .. sec_05.jpg / ui_1.jpg)
    return [
      {id: 'exteriorLights', label: 'Inspect Exterior Lights Hotspot', left: '27.6%', top: '46.2%', hotspot: 'exteriorLights', preset: 'frontLights'},
      {id: 'hoodVent', label: 'Inspect Hood Vent Hotspot', left: '30.6%', top: '49.0%', hotspot: 'hoodVent', preset: 'frontHood'},
      {id: 'bargeBoard', label: 'Inspect Barge Board Hotspot', left: '36.8%', top: '50.0%', hotspot: 'bargeBoard', preset: 'sideBarge'},
      {id: 'sideRocker', label: 'Inspect Lower Sill Aero', left: '38.6%', top: '59.2%', hotspot: 'bargeBoard', preset: 'sideBarge'},
      {id: 'doorCrease', label: 'Inspect Door Airflow', left: '39.5%', top: '41.0%', hotspot: 'Wind' as unknown as HotspotPopupId, preset: 'sideAero'},
      {id: 'quarterPanel', label: 'Inspect Rear Fender', left: '47.1%', top: '45.8%', hotspot: 'rearWing', preset: 'rearWing34'},
      {id: 'rearWing', label: 'Inspect Rear Wing Hotspot', left: '68.6%', top: '36.6%', hotspot: 'rearWing', preset: 'rearWing34'},
    ];
  })();

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden"
      data-testid="roadster-3d-stage"
      data-wireframe-mode={state.wireframeRenderMode}
    >
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive 3D Hotspot Diamonds & Contextual Popups on Home Screen */}
      {isHomeInteractive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Red Diamond Hotspot Nodes on Car (shown in Cockpit Dual-Pass mode) */}
          {state.wireframeRenderMode !== 'studio' &&
            hotspotNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                aria-label={node.label}
                onClick={() => {
                  if (node.preset === 'sideAero') {
                    onToggleWindTunnel();
                  } else {
                    onSelectHotspot(node.hotspot, node.preset);
                  }
                }}
                style={{left: node.left, top: node.top}}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 pointer-events-auto group flex items-center justify-center z-20"
              >
                <span className="w-3.5 h-3.5 rotate-45 border border-[#ff1a1a]/80 bg-black/75 flex items-center justify-center group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(255,26,26,0.8)]">
                  <span className="w-1.5 h-1.5 bg-[#ff1a1a]" />
                </span>
              </button>
            ))}

          {/* Contextual 1:1 Popup Menus with Vertical Red Leader Line matching sec_03..12.jpg */}
          {state.activeHotspot === 'rearWing' && (
            <div
              style={{left: '68.6%', top: '34.2%'}}
              className="absolute pointer-events-auto flex items-stretch z-20"
            >
              {/* Left Vertical Red Connector Line from Diamond Node */}
              <div className="w-[1px] bg-[#ff1a1a]/85 mt-6 mb-1 mr-3.5 shadow-[0_0_6px_#ff1a1a]" />

              <div className="flex flex-col items-start gap-1.5">
                <div className="bg-[#ff1a1a] text-black font-semibold text-xs px-3.5 py-2.5 tracking-tight shadow-[0_0_16px_rgba(255,26,26,0.5)]">
                  Rear Wing
                </div>
                {(
                  [
                    {id: 'Stowed', label: 'Stowed'},
                    {id: 'Low Drag', label: 'Low drag'},
                    {id: 'High Downforce', label: 'High downforce'},
                  ] as {id: RearWingState; label: string}[]
                ).map((opt) => {
                  const isSelected = state.rearWing === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeRearWing(opt.id)}
                      className={`w-fit text-left text-xs px-3.5 py-2.5 transition-all border ${
                        isSelected
                          ? 'bg-[#360606]/90 border-[#ff1a1a] text-[#ff1a1a] font-medium shadow-[0_0_12px_rgba(255,26,26,0.35)]'
                          : 'bg-[#1c0404]/85 border-[#ff1a1a]/25 text-[#b91c1c] hover:text-[#ff1a1a] hover:border-[#ff1a1a]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {state.activeHotspot === 'bargeBoard' && (
            <div
              style={{left: '42.1%', top: '49.5%'}}
              className="absolute pointer-events-auto flex items-stretch z-20"
            >
              <div className="w-[1px] bg-[#ff1a1a]/85 mt-6 mb-1 mr-3.5 shadow-[0_0_6px_#ff1a1a]" />
              <div className="flex flex-col items-start gap-1.5">
                <div className="bg-[#ff1a1a] text-black font-semibold text-xs px-3.5 py-2.5 tracking-tight shadow-[0_0_16px_rgba(255,26,26,0.5)]">
                  Barge Board
                </div>
                <button
                  type="button"
                  onClick={() => onToggleBargeBoard(!state.bargeBoardDeployed)}
                  className="w-fit text-left text-xs px-3.5 py-2.5 transition-all border bg-[#260404]/90 border-[#ff1a1a]/60 text-[#ff1a1a] hover:border-[#ff1a1a]"
                >
                  {state.bargeBoardDeployed ? 'Retract' : 'Deploy'}
                </button>
              </div>
            </div>
          )}

          {state.activeHotspot === 'hoodVent' && (
            <div
              style={{left: '43.4%', top: '47.5%'}}
              className="absolute pointer-events-auto flex items-stretch z-20"
            >
              <div className="w-[1px] bg-[#ff1a1a]/85 mt-6 mb-1 mr-3.5 shadow-[0_0_6px_#ff1a1a]" />
              <div className="flex flex-col items-start gap-1.5">
                <div className="bg-[#ff1a1a] text-black font-semibold text-xs px-3.5 py-2.5 tracking-tight shadow-[0_0_16px_rgba(255,26,26,0.5)]">
                  Hood Vent
                </div>
                <button
                  type="button"
                  onClick={() => onToggleHoodVent(!state.hoodVentOpen)}
                  className="w-fit text-left text-xs px-3.5 py-2.5 transition-all border bg-[#260404]/90 border-[#ff1a1a]/60 text-[#ff1a1a] hover:border-[#ff1a1a]"
                >
                  {state.hoodVentOpen ? 'Close' : 'Open'}
                </button>
              </div>
            </div>
          )}

          {state.activeHotspot === 'exteriorLights' && (
            <div
              style={{left: '42.1%', top: '42.0%'}}
              className="absolute pointer-events-auto flex items-stretch z-20"
            >
              <div className="w-[1px] bg-[#ff1a1a]/85 mt-6 mb-1 mr-3.5 shadow-[0_0_6px_#ff1a1a]" />
              <div className="flex flex-col items-start gap-1.5">
                <div className="bg-[#ff1a1a] text-black font-semibold text-xs px-3.5 py-2.5 tracking-tight shadow-[0_0_16px_rgba(255,26,26,0.5)]">
                  Exterior Lights
                </div>
                {(
                  ['Off', 'Daytime Running Light', 'On', 'Auto'] as ExteriorLightsState[]
                ).map((mode) => {
                  const isSelected = state.exteriorLights === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChangeExteriorLights(mode)}
                      className={`w-fit text-left text-xs px-3.5 py-2.5 transition-all border ${
                        isSelected
                          ? 'bg-[#360606]/90 border-[#ff1a1a] text-[#ff1a1a] font-medium shadow-[0_0_12px_rgba(255,26,26,0.35)]'
                          : 'bg-[#1c0404]/85 border-[#ff1a1a]/25 text-[#b91c1c] hover:text-[#ff1a1a] hover:border-[#ff1a1a]/60'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


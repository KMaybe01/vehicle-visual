import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useVehicleControl } from '../../hooks/useVehicleControl';
import { emitReset, emitToggleDriving } from '../../hooks/useVehicleData';
import { useVehicleStore } from '../../store';
import ControlPanel from './ControlPanel';
import './Vehicle3D.css';

const LOOP_DISTANCE = 600;
const BUILDING_SPACING = 15;
const TREE_SPACING = 7.5;
const LIGHT_SPACING = 20;
const NUM_BUILDINGS_PER_SIDE = 20;
const NUM_TREES_PER_SIDE = 40;
const NUM_LIGHTS_PER_SIDE = 15;

const headlightGeo = new THREE.SphereGeometry(0.04, 8, 8);
const taillightGeo = new THREE.SphereGeometry(0.04, 8, 8);
const roadGeo = new THREE.PlaneGeometry(LOOP_DISTANCE, 7.5);
const centerLineGeo = new THREE.PlaneGeometry(LOOP_DISTANCE, 0.04);
const laneDashGeo = new THREE.PlaneGeometry(3, 0.12);
const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
const treeTrunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.5, 3);
const treeCrownGeo = new THREE.ConeGeometry(0.3, 0.45, 5);
const poleGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.7, 6);
const armGeo = new THREE.BoxGeometry(0.35, 0.02, 0.02);
const headColor = new THREE.Color('#ffdd00');
const brakeColor = new THREE.Color('#ef4444');
const brakeBright = new THREE.Color('#ff2222');
const signalAmber = new THREE.Color('#ff8800');

const TIRE_R = 0.09;
const TIRE_H = 0.07;
const WHEEL_TRACK = 0.38;
const WHEELBASE = 0.52;
const wPos = {
  fl: [WHEEL_TRACK, TIRE_R, WHEELBASE] as const,
  fr: [-WHEEL_TRACK, TIRE_R, WHEELBASE] as const,
  rl: [WHEEL_TRACK, TIRE_R, -WHEELBASE] as const,
  rr: [-WHEEL_TRACK, TIRE_R, -WHEELBASE] as const,
};

const centerMat = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  transparent: true,
  opacity: 0.5,
});
const roadMat = new THREE.MeshStandardMaterial({ color: '#1e1e1e', roughness: 0.95 });
const roadMat2 = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.95 });
const dashMat = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  transparent: true,
  opacity: 0.5,
});
const poleMat = new THREE.MeshStandardMaterial({ color: '#444' });
const armMat = new THREE.MeshStandardMaterial({ color: '#555' });
const treeTrunkMat = new THREE.MeshStandardMaterial({ color: '#5c3a1e' });
const treeCrownMat = new THREE.MeshStandardMaterial({ color: '#2d5a27' });

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

const wheelTireGeo = new THREE.CylinderGeometry(TIRE_R, TIRE_R, TIRE_H, 16);
const wheelRimGeo = new THREE.CylinderGeometry(TIRE_R * 0.55, TIRE_R * 0.55, TIRE_H * 1.05, 12);
const wheelHubGeo = new THREE.CylinderGeometry(TIRE_R * 0.15, TIRE_R * 0.15, TIRE_H * 1.1, 8);
const spokeGeo = new THREE.BoxGeometry(TIRE_R * 0.5, TIRE_H * 1.1, 0.008);

const Wheel = memo(function Wheel({
  pos,
  rotation,
  steer,
}: { pos: readonly [number, number, number]; rotation: number; steer: number }) {
  return (
    <group position={pos} rotation={[0, steer, 0]}>
      <group rotation={[0, 0, rotation]}>
        <mesh geometry={wheelTireGeo}>
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
        <mesh geometry={wheelRimGeo} position={[0, 0, 0]}>
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
        </mesh>
        {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map(
          (a) => (
            <mesh key={a} geometry={spokeGeo} rotation={[0, 0, a]}>
              <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.4} />
            </mesh>
          ),
        )}
        <mesh geometry={wheelHubGeo}>
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
});

function CarBody({ color }: { color: string }) {
  return (
    <group>
      <RoundedBox args={[0.86, 0.24, 1.92]} radius={0.06} smoothness={3}>
        <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.3} clearcoat={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.1, 0.58]} radius={0.04} smoothness={3} position={[0, 0.18, 0.58]}>
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.3} clearcoat={0.1} />
      </RoundedBox>
      <RoundedBox
        args={[0.68, 0.08, 0.48]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.17, -0.64]}
      >
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.3} clearcoat={0.1} />
      </RoundedBox>
      <RoundedBox args={[0.92, 0.03, 0.05]} radius={0.02} position={[0, -0.1, 0.98]}>
        <meshStandardMaterial color="#222" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.92, 0.03, 0.05]} radius={0.02} position={[0, -0.1, -0.98]}>
        <meshStandardMaterial color="#222" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.06, 0.02]} radius={0.01} position={[0, 0.04, 0.97]}>
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.05, 0.02]} radius={0.01} position={[0, 0.04, 0.97]}>
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.38, -0.04, 0.65]}>
        <boxGeometry args={[0.02, 0.18, 0.32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-0.38, -0.04, 0.65]}>
        <boxGeometry args={[0.02, 0.18, 0.32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.38, -0.04, -0.65]}>
        <boxGeometry args={[0.02, 0.18, 0.32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-0.38, -0.04, -0.65]}>
        <boxGeometry args={[0.02, 0.18, 0.32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Cabin({ color }: { color: string }) {
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1a1a2e',
        metalness: 0.9,
        roughness: 0.05,
        transparent: true,
        opacity: 0.45,
        envMapIntensity: 1.5,
      }),
    [],
  );
  return (
    <group>
      <RoundedBox
        args={[0.78, 0.02, 0.68]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.38, -0.06]}
      >
        <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.31, 0.4]} rotation={[0.45, 0, 0]}>
        <planeGeometry args={[0.74, 0.26]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[0, 0.34, -0.5]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[0.7, 0.22]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[0.4, 0.28, -0.06]} rotation={[0, 0, 0.15]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[-0.4, 0.28, -0.06]} rotation={[0, 0, -0.15]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[0.4, 0.28, 0.2]} rotation={[0, 0, 0.15]}>
        <planeGeometry args={[0.18, 0.24]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[-0.4, 0.28, 0.2]} rotation={[0, 0, -0.15]}>
        <planeGeometry args={[0.18, 0.24]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[0.4, 0.2, 0.4]} rotation={[0.45, 0, 0.15]}>
        <planeGeometry args={[0.1, 0.2]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[-0.4, 0.2, 0.4]} rotation={[0.45, 0, -0.15]}>
        <planeGeometry args={[0.1, 0.2]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>
      <mesh position={[0, 0.2, 0.3]}>
        <boxGeometry args={[0.74, 0.02, 0.02]} />
        <meshStandardMaterial color="#ddd" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, -0.2]}>
        <boxGeometry args={[0.72, 0.02, 0.02]} />
        <meshStandardMaterial color="#ddd" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Interior() {
  return (
    <group>
      <RoundedBox args={[0.22, 0.08, 0.14]} radius={0.02} position={[0.18, 0.08, 0.22]}>
        <meshStandardMaterial color="#222" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.08, 0.14]} radius={0.02} position={[-0.18, 0.08, 0.22]}>
        <meshStandardMaterial color="#222" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.07, 0.16]} radius={0.02} position={[0, 0.08, -0.22]}>
        <meshStandardMaterial color="#222" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.09, 0.08]} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[0.06, 0.015, 8, 12]} />
        <meshStandardMaterial color="#333" roughness={0.6} />
      </mesh>
      <RoundedBox args={[0.58, 0.015, 0.06]} radius={0.01} position={[0, 0.13, 0.14]}>
        <meshStandardMaterial color="#444" roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

const CarModel = memo(function CarModel() {
  const data = useVehicleStore((s) => s.currentData);
  const brakeMat = useRef<THREE.MeshStandardMaterial>(null);
  const sigL = useRef<THREE.MeshStandardMaterial>(null);
  const sigR = useRef<THREE.MeshStandardMaterial>(null);
  const headL = useRef<THREE.MeshStandardMaterial>(null);
  const headR = useRef<THREE.MeshStandardMaterial>(null);
  const headLensL = useRef<THREE.MeshStandardMaterial>(null);
  const headLensR = useRef<THREE.MeshStandardMaterial>(null);

  const wheelRot = useMemo(() => ((data?.speed ?? 0) / 180) * Math.PI * 2, [data?.speed]);
  const steerAng = useMemo(() => ((data?.steeringAngle ?? 0) / 45) * 0.55, [data?.steeringAngle]);
  const bodyCol = useMemo(() => {
    if (!data) return '#2563eb';
    if (data.faultCodes.length > 0) return '#dc2626';
    if (data.brakePressed) return '#ea580c';
    return '#2563eb';
  }, [data?.faultCodes, data?.brakePressed]);

  useFrame(() => {
    if (brakeMat.current && data) {
      brakeMat.current.color.lerp(data.brakePressed ? brakeBright : brakeColor, 0.15);
      brakeMat.current.emissiveIntensity = data.brakePressed ? 2.5 : 0.2;
    }
    if (sigL.current && data) {
      const on = data.turnSignal === 'left' || data.turnSignal === 'hazard';
      sigL.current.emissiveIntensity = on ? 4 : 0;
    }
    if (sigR.current && data) {
      const on = data.turnSignal === 'right' || data.turnSignal === 'hazard';
      sigR.current.emissiveIntensity = on ? 4 : 0;
    }
    if (headL.current && data) {
      const on = data.speed > 0.5 || data.brakePressed;
      headL.current.emissiveIntensity = on ? 2 : 0.4;
    }
    if (headR.current && data) {
      const on = data.speed > 0.5 || data.brakePressed;
      headR.current.emissiveIntensity = on ? 2 : 0.4;
    }
    if (headLensL.current && data) {
      headLensL.current.opacity = 0.3 + (data.speed > 0.5 || data.brakePressed ? 0.4 : 0);
    }
    if (headLensR.current && data) {
      headLensR.current.opacity = 0.3 + (data.speed > 0.5 || data.brakePressed ? 0.4 : 0);
    }
  });

  const BODY_Y = 0.25;

  return (
    <group>
      <group position={[0, BODY_Y, 0]}>
        <CarBody color={bodyCol} />
        <Cabin color={bodyCol} />
        <Interior />
        <mesh position={[0.3, 0.1, 0.97]} geometry={headlightGeo}>
          <meshStandardMaterial
            ref={headL}
            color={headColor}
            emissive={headColor}
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[-0.3, 0.1, 0.97]} geometry={headlightGeo}>
          <meshStandardMaterial
            ref={headR}
            color={headColor}
            emissive={headColor}
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0.3, 0.1, 0.97]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            ref={headLensL}
            color="#eee"
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[-0.3, 0.1, 0.97]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            ref={headLensR}
            color="#eee"
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0.36, 0.08, 0.95]} geometry={taillightGeo}>
          <meshStandardMaterial
            ref={sigR}
            color={signalAmber}
            emissive={signalAmber}
            emissiveIntensity={0}
          />
        </mesh>
        <mesh position={[-0.36, 0.08, 0.95]} geometry={taillightGeo}>
          <meshStandardMaterial
            ref={sigL}
            color={signalAmber}
            emissive={signalAmber}
            emissiveIntensity={0}
          />
        </mesh>
        <RoundedBox args={[0.08, 0.03, 0.02]} radius={0.01} position={[0.3, 0.1, -0.97]}>
          <meshStandardMaterial
            ref={brakeMat}
            color={brakeColor}
            emissive={brakeColor}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.03, 0.02]} radius={0.01} position={[-0.3, 0.1, -0.97]}>
          <meshStandardMaterial color={brakeColor} emissive={brakeColor} emissiveIntensity={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.12, 0.02, 0.02]} radius={0.01} position={[0, 0.22, -0.96]}>
          <meshStandardMaterial color={brakeColor} emissive={brakeColor} emissiveIntensity={0.3} />
        </RoundedBox>
        <mesh position={[0.24, 0.12, -0.95]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-0.24, 0.12, -0.95]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.2} />
        </mesh>
        <RoundedBox args={[0.06, 0.05, 0.02]} radius={0.01} position={[0.42, 0.24, 0.65]}>
          <meshStandardMaterial color={bodyCol} metalness={0.4} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.06, 0.05, 0.02]} radius={0.01} position={[-0.42, 0.24, 0.65]}>
          <meshStandardMaterial color={bodyCol} metalness={0.4} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.48, -0.3]}>
          <cylinderGeometry args={[0.005, 0.003, 0.15, 6]} />
          <meshStandardMaterial color="#666" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.5, -0.3]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0, 0.04, -0.98]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.015, 0.06, 6]} />
          <meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} />
        </mesh>
        <RoundedBox args={[0.06, 0.015, 0.09]} radius={0.005} position={[0, 0.06, 0.99]}>
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.06, 0.015, 0.09]} radius={0.005} position={[0, 0.06, -0.99]}>
          <meshStandardMaterial color="#eee" roughness={0.6} />
        </RoundedBox>
      </group>
      <Wheel pos={wPos.fl} rotation={wheelRot} steer={steerAng} />
      <Wheel pos={wPos.fr} rotation={wheelRot} steer={steerAng} />
      <Wheel pos={wPos.rl} rotation={wheelRot} steer={0} />
      <Wheel pos={wPos.rr} rotation={wheelRot} steer={0} />
    </group>
  );
});

type BuildingData = { baseZ: number; side: number; height: number; width: number; hue: number };

function Environment({ scroll }: { scroll: React.MutableRefObject<number> }) {
  const bldRef = useRef<THREE.InstancedMesh>(null);
  const trTrRef = useRef<THREE.InstancedMesh>(null);
  const trCrRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);

  const bldData = useMemo(() => {
    const arr: BuildingData[] = [];
    for (let i = 0; i < NUM_BUILDINGS_PER_SIDE * 2; i++) {
      const side = i < NUM_BUILDINGS_PER_SIDE ? 1 : -1;
      const idx = i % NUM_BUILDINGS_PER_SIDE;
      arr.push({
        baseZ: idx * BUILDING_SPACING,
        side,
        height: 0.5 + Math.random() * 2.2,
        width: 0.6 + Math.random() * 0.8,
        hue: 0.55 + Math.random() * 0.15,
      });
    }
    return arr;
  }, []);

  const treeData = useMemo(() => {
    const arr: { baseZ: number; side: number; size: number }[] = [];
    for (let i = 0; i < NUM_TREES_PER_SIDE * 2; i++) {
      const side = i < NUM_TREES_PER_SIDE ? 1 : -1;
      const idx = i % NUM_TREES_PER_SIDE;
      arr.push({
        baseZ: idx * TREE_SPACING + 3.75,
        side,
        size: 0.7 + Math.random() * 0.5,
      });
    }
    return arr;
  }, []);

  const lightData = useMemo(() => {
    const arr: { baseZ: number; side: number }[] = [];
    for (let i = 0; i < NUM_LIGHTS_PER_SIDE * 2; i++) {
      const side = i < NUM_LIGHTS_PER_SIDE ? 1 : -1;
      const idx = i % NUM_LIGHTS_PER_SIDE;
      arr.push({ baseZ: idx * LIGHT_SPACING + 10, side });
    }
    return arr;
  }, []);

  useEffect(() => {
    const b = bldRef.current;
    const c = _color;
    if (b) {
      bldData.forEach((d, i) => {
        _dummy.position.set(d.side * 3.8, d.height / 2, d.baseZ - LOOP_DISTANCE / 2);
        _dummy.scale.set(d.width, d.height, d.width);
        _dummy.updateMatrix();
        b.setMatrixAt(i, _dummy.matrix);
        c.setHSL(d.hue, 0.3, 0.3 + (d.height / 3) * 0.15);
        b.setColorAt(i, c);
      });
      b.instanceMatrix.needsUpdate = true;
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
    const tt = trTrRef.current;
    if (tt) {
      treeData.forEach((d, i) => {
        _dummy.position.set(d.side * 5.5, 0.25, d.baseZ - LOOP_DISTANCE / 2);
        _dummy.scale.set(1, d.size, 1);
        _dummy.updateMatrix();
        tt.setMatrixAt(i, _dummy.matrix);
      });
      tt.instanceMatrix.needsUpdate = true;
    }
    const tc = trCrRef.current;
    if (tc) {
      treeData.forEach((d, i) => {
        _dummy.position.set(d.side * 5.5, 0.5 + d.size * 0.05, d.baseZ - LOOP_DISTANCE / 2);
        _dummy.scale.set(d.size, d.size, d.size);
        _dummy.updateMatrix();
        tc.setMatrixAt(i, _dummy.matrix);
      });
      tc.instanceMatrix.needsUpdate = true;
    }
    const p = poleRef.current;
    if (p) {
      lightData.forEach((d, i) => {
        _dummy.position.set(d.side * 3.2, 0.35, d.baseZ - LOOP_DISTANCE / 2);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        p.setMatrixAt(i, _dummy.matrix);
      });
      p.instanceMatrix.needsUpdate = true;
    }
    const a = armRef.current;
    if (a) {
      lightData.forEach((d, i) => {
        _dummy.position.set(d.side * 3.2, 0.7, d.baseZ - LOOP_DISTANCE / 2);
        _dummy.updateMatrix();
        a.setMatrixAt(i, _dummy.matrix);
      });
      a.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    const s = scroll.current % LOOP_DISTANCE;
    const b = bldRef.current;
    if (b) {
      bldData.forEach((d, i) => {
        const z = ((d.baseZ - s + LOOP_DISTANCE) % LOOP_DISTANCE) - LOOP_DISTANCE / 2;
        _dummy.position.set(d.side * 3.8, d.height / 2, z);
        _dummy.scale.set(d.width, d.height, d.width);
        _dummy.updateMatrix();
        b.setMatrixAt(i, _dummy.matrix);
      });
      b.instanceMatrix.needsUpdate = true;
    }
    const tt = trTrRef.current;
    if (tt) {
      treeData.forEach((d, i) => {
        const z = ((d.baseZ - s + LOOP_DISTANCE) % LOOP_DISTANCE) - LOOP_DISTANCE / 2;
        _dummy.position.set(d.side * 5.5, 0.25, z);
        _dummy.scale.set(1, d.size, 1);
        _dummy.updateMatrix();
        tt.setMatrixAt(i, _dummy.matrix);
      });
      tt.instanceMatrix.needsUpdate = true;
    }
    const tc = trCrRef.current;
    if (tc) {
      treeData.forEach((d, i) => {
        const z = ((d.baseZ - s + LOOP_DISTANCE) % LOOP_DISTANCE) - LOOP_DISTANCE / 2;
        _dummy.position.set(d.side * 5.5, 0.5 + d.size * 0.05, z);
        _dummy.scale.set(d.size, d.size, d.size);
        _dummy.updateMatrix();
        tc.setMatrixAt(i, _dummy.matrix);
      });
      tc.instanceMatrix.needsUpdate = true;
    }
    const p = poleRef.current;
    if (p) {
      lightData.forEach((d, i) => {
        const z = ((d.baseZ - s + LOOP_DISTANCE) % LOOP_DISTANCE) - LOOP_DISTANCE / 2;
        _dummy.position.set(d.side * 3.2, 0.35, z);
        _dummy.updateMatrix();
        p.setMatrixAt(i, _dummy.matrix);
      });
      p.instanceMatrix.needsUpdate = true;
    }
    const a = armRef.current;
    if (a) {
      lightData.forEach((d, i) => {
        const z = ((d.baseZ - s + LOOP_DISTANCE) % LOOP_DISTANCE) - LOOP_DISTANCE / 2;
        _dummy.position.set(d.side * 3.2, 0.7, z);
        _dummy.updateMatrix();
        a.setMatrixAt(i, _dummy.matrix);
      });
      a.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={bldRef} args={[buildingGeo, undefined, NUM_BUILDINGS_PER_SIDE * 2]}>
        <meshStandardMaterial roughness={0.7} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={trTrRef} args={[treeTrunkGeo, treeTrunkMat, NUM_TREES_PER_SIDE * 2]} />
      <instancedMesh ref={trCrRef} args={[treeCrownGeo, treeCrownMat, NUM_TREES_PER_SIDE * 2]} />
      <instancedMesh ref={poleRef} args={[poleGeo, poleMat, NUM_LIGHTS_PER_SIDE * 2]} />
      <instancedMesh ref={armRef} args={[armGeo, armMat, NUM_LIGHTS_PER_SIDE * 2]} />
    </>
  );
}

function Road({ scroll }: { scroll: React.MutableRefObject<number> }) {
  const dashesRef = useRef<THREE.InstancedMesh>(null);
  const half = LOOP_DISTANCE / 2;

  useFrame(() => {
    const s = scroll.current % LOOP_DISTANCE;
    const m = dashesRef.current;
    if (m) {
      for (let i = 0; i < 60; i++) {
        const z = ((((i * 5 - s) % LOOP_DISTANCE) + LOOP_DISTANCE) % LOOP_DISTANCE) - half;
        _dummy.position.set(0, 0.01, z);
        _dummy.updateMatrix();
        m.setMatrixAt(i, _dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        geometry={roadGeo}
        material={roadMat}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.9, -0.008, 0]}
        receiveShadow
        geometry={roadGeo}
        material={roadMat2}
      />
      <instancedMesh ref={dashesRef} args={[laneDashGeo, dashMat, 60]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        geometry={centerLineGeo}
        material={centerMat}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.55, 0.005, 0]} geometry={centerLineGeo}>
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.25} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.55, 0.005, 0]} geometry={centerLineGeo}>
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

const DataOverlay = memo(function DataOverlay() {
  const data = useVehicleStore((s) => s.currentData);

  const blink = useMemo(() => {
    if (!data || data.turnSignal === 'none') return '';
    return data.turnSignal === 'left' ? ' ◄' : data.turnSignal === 'right' ? ' ►' : ' ◄►';
  }, [data?.turnSignal]);

  return (
    <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
      <div className="overlay-panel">
        {data ? (
          <>
            <div className="overlay-header">实时车况</div>
            <div className="overlay-row">
              <span className="overlay-label">车速</span>
              <span className="overlay-value" style={{ color: '#3b82f6' }}>
                {data.speed.toFixed(0)}
              </span>
              <span className="overlay-unit">km/h</span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">转速</span>
              <span className="overlay-value" style={{ color: '#22c55e' }}>
                {data.rpm.toFixed(0)}
              </span>
              <span className="overlay-unit">rpm</span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">档位</span>
              <span className="overlay-value" style={{ color: '#a78bfa' }}>
                {data.gearPosition}
              </span>
              <span className="overlay-unit">
                {data.brakePressed ? '🛑' : ''}
                {data.throttlePos > 20 ? '⚡' : ''}
              </span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">转向</span>
              <span className="overlay-value" style={{ color: '#f97316' }}>
                {data.steeringAngle.toFixed(1)}°
              </span>
              <span className="overlay-unit">{blink}</span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">油门</span>
              <span className="overlay-value" style={{ color: '#22c55e' }}>
                {data.throttlePos.toFixed(0)}
              </span>
              <span className="overlay-unit">%</span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">油量</span>
              <span className="overlay-value" style={{ color: '#eab308' }}>
                {data.fuelLevel.toFixed(0)}
              </span>
              <span className="overlay-unit">%</span>
            </div>
            <div className="overlay-row">
              <span className="overlay-label">里程</span>
              <span className="overlay-value" style={{ color: '#06b6d4' }}>
                {data.odometer.toFixed(1)}
              </span>
              <span className="overlay-unit">km</span>
            </div>
            {data.faultCodes.length > 0 && (
              <div className="overlay-row">
                <span className="overlay-label">故障码</span>
                <span className="overlay-value" style={{ color: '#ef4444' }}>
                  P{data.faultCodes[0].toString().padStart(4, '0')}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="overlay-row">
            <span className="overlay-label">等待数据...</span>
          </div>
        )}
      </div>
    </Html>
  );
});

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={['#1e3a5f', '#0a0a0a', 0.5]} />
    </>
  );
}

function SceneContent() {
  const scrollRef = useRef(0);

  useFrame((_, delta) => {
    const data = useVehicleStore.getState().currentData;
    if (data) {
      scrollRef.current += data.speed * 0.15 * delta;
    }
  });

  return (
    <>
      <SceneLights />
      <Road scroll={scrollRef} />
      <Environment scroll={scrollRef} />
      <CarModel />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={14}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
      />
      <DataOverlay />
    </>
  );
}

export default function Vehicle3D() {
  const { controlRef, setControl } = useVehicleControl();

  return (
    <div className="vehicle-3d-page">
      <div className="page-header">
        <div>
          <h1>3D 数字孪生</h1>
          <p>车辆实时状态三维可视化 / 拖拽旋转查看 / WASD 驾驶</p>
        </div>
      </div>
      <div className="vehicle-3d-body">
        <div className="canvas-container">
          <Canvas shadows camera={{ position: [3, 2.5, 5], fov: 45 }} gl={{ antialias: true }}>
            <Suspense fallback={null}>
              <SceneContent />
            </Suspense>
          </Canvas>
        </div>
        <ControlPanel controlRef={controlRef} setControl={setControl} />
      </div>
    </div>
  );
}

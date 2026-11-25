import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { rooms, roomById, walls, glassFront, H, type RoomId, type Hotspot } from '../../../data/lumen';
import { wallFrame, wallPieces } from '../../../lib/walls';
import * as T from './textures';
import type { Viewer } from '../PlanSVG';

export interface SceneProps {
  room: RoomId;
  night: boolean;
  intro: boolean;
  quality: 'alta' | 'ligera';
  reduced: boolean;
  activeHotspot: string | null;
  viewer: MutableRefObject<Viewer | null>;
  fade: (mid: () => void) => void;
  onArrive: (id: RoomId) => void;
  onMoveStart: () => void;
  onHotspot: (h: Hotspot) => void;
  onNavigate: (id: RoomId) => void;
  onReady: () => void;
  onQualityDrop: () => void;
}

type V3 = [number, number, number];
const EYE = 1.6;
const ELEVATOR_START: [number, number] = [13.5, 15.35];

/* ───────────── Materiales ───────────── */

function createMaterials() {
  const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
  const trav = T.travertine();
  const walnut = T.walnut();
  const marble = T.marble();
  const deck = T.deck();
  const facade = T.facade();
  facade.color.repeat.set(1, 1);
  facade.emissive.repeat.set(1, 1);
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  return {
    floor: std({ map: rep(trav, 22 / 1.2, 14 / 1.2), roughness: 0.42, metalness: 0 }),
    bathFloor: std({ map: rep(marble, 2, 3), roughness: 0.25 }),
    deck: std({ map: rep(deck, 10, 3), roughness: 0.8 }),
    plaster: std({ color: '#e7e4dd', roughness: 0.95 }),
    ceiling: std({ color: '#efede8', roughness: 1 }),
    travWall: (l: number) => std({ map: rep(trav, l / 1.2, H / 1.2), roughness: 0.6 }),
    walnutWall: (l: number) => std({ map: rep(walnut, l / 0.9, 1), roughness: 0.55 }),
    marbleWall: (l: number) => std({ map: rep(marble, l / 2, H / 2), roughness: 0.2 }),
    marble: std({ map: marble, roughness: 0.22 }),
    walnut: std({ map: walnut, roughness: 0.5 }),
    oak: std({ map: T.oak(), roughness: 0.6 }),
    travertine: std({ map: trav, roughness: 0.5 }),
    granite: std({ color: '#1f2326', roughness: 0.32, metalness: 0.1 }),
    brass: std({ color: '#b0915f', metalness: 1, roughness: 0.32 }),
    blackMetal: std({ color: '#1c1f21', metalness: 0.6, roughness: 0.45 }),
    linen: std({ map: T.linen(), roughness: 1 }),
    linenDark: std({ map: T.linen('#6e6a62'), roughness: 1 }),
    leather: std({ color: '#7a4e2f', roughness: 0.62 }),
    white: std({ color: '#f1efea', roughness: 0.35 }),
    rug: std({ map: T.linen('#b9ae9c'), roughness: 1 }),
    rugDark: std({ map: T.linen('#4b4944'), roughness: 1 }),
    pot: std({ color: '#3b3a37', roughness: 0.85 }),
    leaf: std({ color: '#4d5c3f', roughness: 0.9, flatShading: true }),
    art: std({ map: T.artwork(), roughness: 0.9 }),
    mirror: std({ color: '#b7c4c8', metalness: 0.55, roughness: 0.12 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#cfe3e8', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide }),
    railGlass: new THREE.MeshPhysicalMaterial({ color: '#bfd8dc', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    water: std({ color: '#2d7f90', roughness: 0.04, metalness: 0.35, emissive: new THREE.Color('#1aa6c4'), emissiveIntensity: 0 }),
    poolShell: std({ color: '#d1c2a4', roughness: 0.8 }),
    lamp: std({ color: '#fff3df', emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.15, roughness: 0.6 }),
    cove: std({ color: '#ffffff', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0, roughness: 1 }),
    fire: std({ color: '#ff9a3c', emissive: new THREE.Color('#ff7a1a'), emissiveIntensity: 1.2 }),
    cava: std({ color: '#2a1d18', emissive: new THREE.Color('#ffb46b'), emissiveIntensity: 0.06, roughness: 0.3 }),
    city: std({ map: facade.color, emissiveMap: facade.emissive, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: 0.8 }),
    tower: std({ map: rep(facade.color, 1.5, 1.6), emissiveMap: rep(facade.emissive, 1.5, 1.6), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: 0.6 }),
    ground: std({ color: '#5b625c', roughness: 1 }),
  };
}
type Mats = ReturnType<typeof createMaterials>;
const MatCtx = createContext<Mats | null>(null);
const useMats = () => useContext(MatCtx)!;

/* ───────────── Primitivas ───────────── */

function B({ p, s, m, r, cast = true, receive = true }: { p: V3; s: V3; m: THREE.Material; r?: V3; cast?: boolean; receive?: boolean }) {
  return (
    <mesh position={p} rotation={r} castShadow={cast} receiveShadow={receive} material={m}>
      <boxGeometry args={s} />
    </mesh>
  );
}
function Cyl({ p, r, h, m, seg = 24, cast = true }: { p: V3; r: number | [number, number]; h: number; m: THREE.Material; seg?: number; cast?: boolean }) {
  const [rt, rb] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} castShadow={cast} receiveShadow material={m}>
      <cylinderGeometry args={[rt, rb, h, seg]} />
    </mesh>
  );
}
function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  const m = useMats();
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.3, 0]} r={[0.26, 0.2]} h={0.6} m={m.pot} />
      <mesh position={[0, 1.05, 0]} castShadow material={m.leaf}><icosahedronGeometry args={[0.48, 1]} /></mesh>
      <mesh position={[0.18, 1.45, 0.1]} castShadow material={m.leaf}><icosahedronGeometry args={[0.34, 1]} /></mesh>
      <mesh position={[-0.2, 1.3, -0.12]} castShadow material={m.leaf}><icosahedronGeometry args={[0.3, 1]} /></mesh>
    </group>
  );
}
function Chair({ p, rot = 0, m }: { p: V3; rot?: number; m: THREE.Material }) {
  const mats = useMats();
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <B p={[0, 0.45, 0]} s={[0.46, 0.05, 0.46]} m={m} />
      <B p={[0, 0.72, -0.21]} s={[0.46, 0.5, 0.04]} m={m} />
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <B key={i} p={[x, 0.22, z]} s={[0.03, 0.44, 0.03]} m={mats.blackMetal} cast={false} />
      ))}
    </group>
  );
}

/* ───────────── Arquitectura ───────────── */

function Walls({ elevatorDoors }: { elevatorDoors: MutableRefObject<(THREE.Mesh | null)[]> }) {
  const m = useMats();
  const finishMats = useMemo(() => walls.map((w) => {
    const { len } = wallFrame(w);
    if (w.finish === 'nogal') return m.walnutWall(len);
    if (w.finish === 'travertino') return m.travWall(len);
    if (w.finish === 'marmol') return m.marbleWall(len);
    return null;
  }), [m]);

  return (
    <group>
      {walls.map((w, wi) => {
        const { ux, uz, angle } = wallFrame(w);
        const nx = -uz, nz = ux;
        const at = (s: number) => [w.a[0] + ux * s, w.a[1] + uz * s] as const;
        const pieces = wallPieces(w);
        const fm = finishMats[wi];
        return (
          <group key={wi}>
            {pieces.map((pc, i) => {
              const [cx, cz] = at((pc.s0 + pc.s1) / 2);
              const len = pc.s1 - pc.s0;
              const cy = (pc.y0 + pc.y1) / 2;
              const h = pc.y1 - pc.y0;
              if (pc.kind === 'glass') {
                return (
                  <group key={i}>
                    <mesh position={[cx, cy, cz]} rotation={[0, angle, 0]} material={m.glass}><planeGeometry args={[len, h]} /></mesh>
                    <B p={[cx, pc.y1 - 0.02, cz]} s={[len, 0.04, 0.08]} r={[0, angle, 0]} m={m.blackMetal} />
                    <B p={[cx, pc.y0 + 0.02, cz]} s={[len, 0.04, 0.08]} r={[0, angle, 0]} m={m.blackMetal} />
                  </group>
                );
              }
              const off = (w.finishSide ?? 1) * (w.t / 2 + 0.011);
              return (
                <group key={i}>
                  <B p={[cx, cy, cz]} s={[len, h, w.t]} r={[0, angle, 0]} m={m.plaster} />
                  {fm && <B p={[cx + nx * off, cy, cz + nz * off]} s={[len, h, 0.02]} r={[0, angle, 0]} m={fm} cast={false} />}
                </group>
              );
            })}
            {(w.openings ?? []).map((o, i) => {
              const width = o.to - o.from;
              if (o.door === 'swing') {
                const [hx, hz] = at(o.from);
                const top = o.top ?? 2.4;
                const sx = nx * (o.side ?? 1), sz = nz * (o.side ?? 1);
                const leafAngle = Math.atan2(-sz, sx);
                return <B key={i} p={[hx + sx * width / 2 + ux * 0.03, top / 2, hz + sz * width / 2 + uz * 0.03]} s={[width, top - 0.02, 0.045]} r={[0, leafAngle, 0]} m={m.walnut} />;
              }
              if (o.door === 'closed') {
                const [cx, cz] = at((o.from + o.to) / 2);
                return <B key={i} p={[cx, (o.top ?? 2.3) / 2, cz]} s={[width, o.top ?? 2.3, 0.05]} r={[0, angle, 0]} m={m.walnut} />;
              }
              if (o.door === 'elevator') {
                const [cx, cz] = at((o.from + o.to) / 2);
                const top = o.top ?? 2.7;
                return (
                  <group key={i}>
                    {[-1, 1].map((side, k) => (
                      <mesh key={k} ref={(el) => { elevatorDoors.current[k] = el; }} position={[cx + side * width / 4, top / 2, cz - 0.04]} castShadow material={m.brass}>
                        <boxGeometry args={[width / 2 - 0.01, top, 0.04]} />
                      </mesh>
                    ))}
                    {/* Cabina */}
                    <B p={[cx, -0.05, cz + 1.05]} s={[width + 0.2, 0.1, 1.9]} m={m.walnut} />
                    <B p={[cx, top + 0.05, cz + 1.05]} s={[width + 0.2, 0.1, 1.9]} m={m.blackMetal} />
                    <B p={[cx - width / 2 - 0.05, top / 2, cz + 1.05]} s={[0.1, top, 1.9]} m={m.brass} />
                    <B p={[cx + width / 2 + 0.05, top / 2, cz + 1.05]} s={[0.1, top, 1.9]} m={m.brass} />
                    <B p={[cx, top / 2, cz + 2.0]} s={[width + 0.2, top, 0.1]} m={m.mirror} />
                    <B p={[cx, top - 0.02, cz + 1.05]} s={[width * 0.6, 0.02, 1.2]} m={m.cove} cast={false} />
                  </group>
                );
              }
              return null;
            })}
          </group>
        );
      })}

      {/* Cancelería corrida hacia la terraza */}
      {Array.from({ length: Math.round((glassFront.to - glassFront.from) / glassFront.mullionEvery) + 1 }, (_, k) => {
        const x = glassFront.from + k * glassFront.mullionEvery;
        return <B key={k} p={[x, H / 2, 0]} s={[0.06, H, 0.12]} m={m.blackMetal} />;
      })}
      <mesh position={[11, H / 2, 0]} material={m.glass}><planeGeometry args={[22, H]} /></mesh>
      <B p={[11, H - 0.04, 0]} s={[22, 0.08, 0.14]} m={m.blackMetal} />
      <B p={[11, 0.015, 0]} s={[22, 0.03, 0.14]} m={m.blackMetal} />

      {/* Losas, plafón y piso */}
      <mesh position={[11, 0, 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.floor}><planeGeometry args={[22, 14]} /></mesh>
      <mesh position={[9, 0.004, 11]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.bathFloor}><planeGeometry args={[4, 6]} /></mesh>
      <mesh position={[11, H, 7]} rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow material={m.ceiling}><planeGeometry args={[22, 14]} /></mesh>
      <B p={[11, H + 0.26, 6.3]} s={[22.6, 0.5, 16]} m={m.plaster} />
      <B p={[11, -0.27, 4.5]} s={[22.6, 0.5, 19.8]} m={m.plaster} cast={false} />
      {/* Volado sobre la terraza */}
      <B p={[11, H + 0.1, -1.1]} s={[22.6, 0.2, 2.2]} m={m.plaster} />
      {/* Plafón perimetral con luz indirecta (sala y cocina) */}
      {[[5.5, 0.25], [16.5, 0.25]].map(([x], i) => (
        <B key={i} p={[x, H - 0.03, 7.6]} s={[10, 0.02, 0.12]} m={m.cove} cast={false} receive={false} />
      ))}
    </group>
  );
}

/* ───────────── Interiores ───────────── */

function Sala() {
  const m = useMats();
  const arc = useMemo(() => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(6.6, 0.05, 1.5), new THREE.Vector3(6.6, 2.7, 1.8), new THREE.Vector3(5.0, 2.05, 2.5)), 32, 0.018, 8), []);
  return (
    <group>
      {/* Chimenea */}
      <B p={[0.19, 0.72, 4]} s={[0.05, 0.5, 2.9]} m={m.granite} />
      <B p={[0.22, 0.62, 4]} s={[0.02, 0.1, 2.5]} m={m.fire} cast={false} />
      <B p={[0.62, 0.17, 4]} s={[0.9, 0.34, 4.8]} m={m.travertine} />
      {/* Alfombra, sofá en L, mesa */}
      <B p={[3.9, 0.006, 4]} s={[5.2, 0.012, 4.2]} m={m.rug} cast={false} />
      <B p={[5.7, 0.22, 4.1]} s={[1.0, 0.44, 3.8]} m={m.linen} />
      <B p={[6.14, 0.58, 4.1]} s={[0.22, 0.5, 3.8]} m={m.linen} />
      <B p={[4.75, 0.22, 2.0]} s={[1.9, 0.44, 1.0]} m={m.linen} />
      <B p={[4.75, 0.58, 1.56]} s={[1.9, 0.5, 0.22]} m={m.linen} />
      {[3.0, 4.1, 5.2].map((z, i) => <B key={i} p={[5.55, 0.52, z]} s={[0.55, 0.16, 0.95]} m={m.linen} />)}
      <Cyl p={[3.3, 0.18, 4.2]} r={0.75} h={0.36} m={m.travertine} seg={48} />
      <Cyl p={[3.1, 0.42, 4.0]} r={0.12} h={0.12} m={m.brass} />
      {/* Sillones de piel */}
      {[[2.2, 1.6], [2.2, 6.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i ? 2.4 : 0.7, 0]}>
          <B p={[0, 0.2, 0]} s={[0.85, 0.4, 0.8]} m={m.leather} />
          <B p={[0, 0.55, -0.35]} s={[0.85, 0.5, 0.12]} m={m.leather} />
        </group>
      ))}
      {/* Lámpara de arco */}
      <Cyl p={[6.6, 0.03, 1.5]} r={0.22} h={0.06} m={m.marble} />
      <mesh geometry={arc} material={m.brass} castShadow />
      <mesh position={[5.0, 1.98, 2.5]} rotation={[Math.PI, 0, 0]} material={m.lamp}><sphereGeometry args={[0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      {/* Aparador y obra */}
      <B p={[2.5, 0.38, 7.66]} s={[3.6, 0.6, 0.45]} m={m.walnut} />
      <mesh position={[2.5, 1.85, 7.91]} rotation={[0, Math.PI, 0]} material={m.art}><planeGeometry args={[2.2, 1.375]} /></mesh>
      <B p={[2.5, 2.62, 7.84]} s={[0.8, 0.04, 0.1]} m={m.brass} />
      <Plant p={[10.2, 0, 0.8]} s={1.2} />
      <Plant p={[0.9, 0, 0.9]} />
      <Plant p={[9.8, 0, 7.3]} s={0.9} />
    </group>
  );
}

function Cocina() {
  const m = useMats();
  return (
    <group>
      {/* Cocina de muro */}
      <B p={[18.8, 0.45, 7.6]} s={[5.0, 0.9, 0.65]} m={m.oak} />
      <B p={[18.8, 0.92, 7.6]} s={[5.04, 0.04, 0.68]} m={m.granite} />
      <B p={[18.8, 1.55, 7.89]} s={[5.0, 1.2, 0.02]} m={m.granite} cast={false} />
      <B p={[18.8, 2.55, 7.7]} s={[5.0, 0.8, 0.45]} m={m.oak} />
      {/* Cava */}
      <B p={[21.6, 1.2, 7.0]} s={[0.55, 2.4, 1.6]} m={m.cava} />
      {/* Isla */}
      <B p={[17.2, 0.46, 5.0]} s={[4.2, 0.92, 1.1]} m={m.granite} />
      {[16.0, 17.2, 18.4].map((x, i) => (
        <group key={i}>
          <Cyl p={[x, 0.36, 4.1]} r={0.03} h={0.72} m={m.brass} seg={12} />
          <Cyl p={[x, 0.74, 4.1]} r={0.2} h={0.06} m={m.leather} />
          <Cyl p={[x, 2.85, 5.0]} r={0.006} h={0.7} m={m.blackMetal} seg={6} cast={false} />
          <mesh position={[x, 2.42, 5.0]} material={m.lamp}><sphereGeometry args={[0.15, 24, 16]} /></mesh>
          <Cyl p={[x, 2.53, 5.0]} r={[0.05, 0.08]} h={0.08} m={m.brass} seg={16} cast={false} />
        </group>
      ))}
      {/* Comedor */}
      <B p={[16.5, 0.74, 2.3]} s={[3.6, 0.06, 1.1]} m={m.walnut} />
      <B p={[15.2, 0.36, 2.3]} s={[0.08, 0.72, 0.8]} m={m.walnut} />
      <B p={[17.8, 0.36, 2.3]} s={[0.08, 0.72, 0.8]} m={m.walnut} />
      {[15.3, 16.1, 16.9, 17.7].map((x, i) => (
        <group key={i}>
          <Chair p={[x, 0, 1.5]} rot={0} m={m.linenDark} />
          <Chair p={[x, 0, 3.1]} rot={Math.PI} m={m.linenDark} />
        </group>
      ))}
      <B p={[16.5, 2.35, 2.3]} s={[2.4, 0.04, 0.08]} m={m.brass} />
      <B p={[16.5, 2.32, 2.3]} s={[2.3, 0.012, 0.05]} m={m.lamp} cast={false} />
      <Plant p={[21.2, 0, 0.9]} s={1.1} />
    </group>
  );
}

function Recamara() {
  const m = useMats();
  return (
    <group>
      <B p={[2.05, 0.006, 11]} s={[3.6, 0.012, 3.2]} m={m.rugDark} cast={false} />
      <B p={[1.25, 0.18, 11]} s={[2.1, 0.36, 2.05]} m={m.walnut} />
      <B p={[1.25, 0.47, 11]} s={[2.05, 0.22, 1.98]} m={m.white} />
      <B p={[1.9, 0.6, 11]} s={[0.75, 0.05, 2.02]} m={m.leather} />
      {[10.5, 11.5].map((z, i) => <B key={i} p={[0.45, 0.66, z]} s={[0.3, 0.18, 0.8]} m={m.white} />)}
      {[9.45, 12.55].map((z, i) => (
        <group key={i}>
          <B p={[0.4, 0.5, z]} s={[0.45, 0.1, 0.6]} m={m.walnut} />
          <Cyl p={[0.4, 0.74, z]} r={0.11} h={0.38} m={m.lamp} />
        </group>
      ))}
      <B p={[2.62, 0.22, 11]} s={[0.45, 0.44, 1.6]} m={m.leather} />
      <B p={[2.6, 1.3, 8.36]} s={[4.2, 2.6, 0.5]} m={m.oak} />
      <group position={[5.3, 0, 12.8]} rotation={[0, -2.4, 0]}>
        <B p={[0, 0.2, 0]} s={[0.85, 0.4, 0.8]} m={m.linen} />
        <B p={[0, 0.55, -0.35]} s={[0.85, 0.5, 0.12]} m={m.linen} />
      </group>
      <Plant p={[6.4, 0, 13.4]} s={0.8} />
    </group>
  );
}

function Bano() {
  const m = useMats();
  return (
    <group>
      {/* Revestimiento de mármol */}
      <B p={[9, H / 2, 13.83]} s={[3.8, H, 0.02]} m={m.marble} cast={false} />
      <B p={[9, H / 2, 8.1]} s={[3.8, H, 0.02]} m={m.marble} cast={false} />
      <B p={[10.9, H / 2, 11]} s={[0.02, H, 5.8]} m={m.marble} cast={false} />
      {/* Tina exenta */}
      <RoundedBox args={[1.8, 0.6, 0.85]} radius={0.22} smoothness={4} position={[9, 0.3, 12.9]} castShadow receiveShadow material={m.white} />
      <B p={[9, 0.585, 12.9]} s={[1.4, 0.02, 0.5]} m={m.poolShell} cast={false} />
      {/* Lavabos flotantes */}
      <B p={[10.62, 0.82, 10.6]} s={[0.5, 0.16, 2.4]} m={m.walnut} />
      {[10.0, 11.2].map((z, i) => (
        <group key={i}>
          <B p={[10.6, 0.93, z]} s={[0.4, 0.06, 0.5]} m={m.white} />
          <Cyl p={[10.83, 1.05, z]} r={0.018} h={0.16} m={m.brass} seg={12} />
        </group>
      ))}
      <B p={[10.88, 1.68, 10.6]} s={[0.02, 1.0, 2.2]} m={m.mirror} cast={false} />
      <B p={[10.89, 1.68, 10.6]} s={[0.01, 1.08, 2.28]} m={m.cove} cast={false} />
      <Plant p={[7.6, 0, 13.4]} s={0.6} />
    </group>
  );
}

function Vestibulo() {
  const m = useMats();
  return (
    <group>
      <B p={[11.4, 0.82, 11.6]} s={[0.42, 0.06, 1.9]} m={m.walnut} />
      <B p={[11.4, 0.4, 10.75]} s={[0.36, 0.8, 0.05]} m={m.walnut} />
      <B p={[11.4, 0.4, 12.45]} s={[0.36, 0.8, 0.05]} m={m.walnut} />
      <mesh position={[11.4, 1.0, 11.3]} castShadow material={m.granite}><sphereGeometry args={[0.15, 32, 16]} /></mesh>
      <B p={[15.5, 0.5, 8.65]} s={[0.5, 1.0, 0.5]} m={m.travertine} />
      <mesh position={[15.5, 1.3, 8.65]} rotation={[0.4, 0.6, 0]} castShadow material={m.brass}><torusGeometry args={[0.24, 0.05, 16, 48]} /></mesh>
      <B p={[13.5, 0.006, 11]} s={[2.4, 0.012, 3.2]} m={m.rug} cast={false} />
    </group>
  );
}

function Estudio() {
  const m = useMats();
  return (
    <group>
      <B p={[17.75, 0.74, 13.4]} s={[2.2, 0.05, 0.7]} m={m.walnut} />
      <B p={[16.75, 0.36, 13.4]} s={[0.05, 0.72, 0.6]} m={m.walnut} />
      <B p={[18.75, 0.36, 13.4]} s={[0.05, 0.72, 0.6]} m={m.walnut} />
      <Chair p={[17.75, 0, 12.7]} rot={Math.PI} m={m.leather} />
      <Cyl p={[18.5, 0.95, 13.5]} r={0.08} h={0.35} m={m.lamp} />
      <B p={[18.5, 0.22, 8.62]} s={[2.2, 0.44, 0.9]} m={m.linen} />
      <B p={[18.5, 0.58, 8.25]} s={[2.2, 0.5, 0.18]} m={m.linen} />
      <B p={[16.3, 1.4, 12.4]} s={[0.35, 2.8, 2.6]} m={m.oak} />
      {[0.5, 1.1, 1.7, 2.3].map((y, i) => <B key={i} p={[16.33, y, 12.4]} s={[0.3, 0.42, 2.4]} m={i % 2 ? m.linenDark : m.rugDark} cast={false} />)}
      <B p={[18.5, 0.006, 10.4]} s={[2.6, 0.012, 2.0]} m={m.rug} cast={false} />
    </group>
  );
}

function Terraza() {
  const m = useMats();
  return (
    <group>
      {/* Deck alrededor de la alberca */}
      <mesh position={[11, 0, -1.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.deck}><planeGeometry args={[22, 2.6]} /></mesh>
      <mesh position={[6, 0, -3.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.deck}><planeGeometry args={[12, 2.4]} /></mesh>
      <mesh position={[21.5, 0, -3.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.deck}><planeGeometry args={[1, 2.4]} /></mesh>
      {/* Alberca */}
      <mesh position={[16.5, -0.006, -3.8]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}><planeGeometry args={[9, 2.4]} /></mesh>
      {/* Barandal de cristal */}
      <mesh position={[11, 0.55, -5]} material={m.railGlass}><planeGeometry args={[22, 1.1]} /></mesh>
      <mesh position={[0, 0.55, -2.5]} rotation={[0, Math.PI / 2, 0]} material={m.railGlass}><planeGeometry args={[5, 1.1]} /></mesh>
      <mesh position={[22, 0.55, -2.5]} rotation={[0, Math.PI / 2, 0]} material={m.railGlass}><planeGeometry args={[5, 1.1]} /></mesh>
      <B p={[11, 1.1, -5]} s={[22, 0.02, 0.04]} m={m.brass} cast={false} />
      {/* Camastros */}
      {[9.3, 10.6].map((x, i) => (
        <group key={i} position={[x, 0, -3.6]}>
          <B p={[0, 0.18, 0.2]} s={[0.7, 0.12, 1.5]} m={m.white} />
          <B p={[0, 0.42, -0.62]} s={[0.7, 0.08, 0.6]} r={[0.9, 0, 0]} m={m.white} />
          <B p={[0, 0.06, 0]} s={[0.66, 0.12, 1.8]} m={m.oak} />
        </group>
      ))}
      {/* Jardinera con luz rasante */}
      <B p={[0.55, 0.35, -2.6]} s={[0.8, 0.7, 4.6]} m={m.granite} />
      <B p={[0.98, 0.04, -2.6]} s={[0.03, 0.03, 4.4]} m={m.cove} cast={false} />
      {[-4.2, -3.0, -1.6].map((z, i) => <Plant key={i} p={[0.55, 0.15, z]} s={0.9} />)}
      {/* Sala exterior */}
      <B p={[4.4, 0.2, -3.9]} s={[2.6, 0.4, 0.9]} m={m.linenDark} />
      <B p={[4.4, 0.5, -4.3]} s={[2.6, 0.4, 0.16]} m={m.linenDark} />
      <Cyl p={[4.4, 0.16, -2.7]} r={0.5} h={0.32} m={m.travertine} />
    </group>
  );
}

/* ───────────── Exterior: ciudad, cielo, estrellas ───────────── */

const SKY_VERT = `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_FRAG = `
uniform float uNight; uniform vec3 uSun; varying vec3 vP;
void main(){
  float h = clamp(vP.y, -0.2, 1.0);
  vec3 dayTop = vec3(0.42,0.58,0.74), dayHz = vec3(0.93,0.85,0.74);
  vec3 nTop = vec3(0.01,0.03,0.07), nHz = vec3(0.16,0.15,0.22);
  vec3 day = mix(dayHz, dayTop, pow(max(h,0.0), 0.55));
  float sun = pow(max(dot(normalize(vP), normalize(uSun)), 0.0), 64.0);
  day += vec3(1.0,0.8,0.55) * sun * 0.9 + vec3(1.0,0.75,0.5) * pow(max(dot(normalize(vP), normalize(uSun)),0.0), 6.0) * 0.18;
  vec3 night = mix(nHz, nTop, pow(max(h,0.0), 0.4));
  gl_FragColor = vec4(mix(day, night, uNight), 1.0);
}`;

function City({ count, night }: { count: number; night: MutableRefObject<{ v: number }> }) {
  const m = useMats();
  const ref = useRef<THREE.InstancedMesh>(null);
  const stars = useRef<THREE.PointsMaterial>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const sunDir = useMemo(() => new THREE.Vector3(-0.55, 0.32, -0.77).normalize(), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let s = 42;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const ang = r() * Math.PI * 2;
      const rad = 70 + Math.pow(r(), 0.8) * 420;
      const near = rad < 170;
      const h = near ? 18 + r() * 52 : 30 + r() * (rad > 300 ? 170 : 120);
      const w = 14 + r() * 24;
      d.position.set(11 + Math.cos(ang) * rad, -102 + h / 2, 4 + Math.sin(ang) * rad);
      d.scale.set(w, h, 12 + r() * 22);
      d.rotation.y = r() * 0.5;
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 700; i++) {
      const u = r() * Math.PI * 2, v = 0.08 + r() * 0.9;
      pts.push(Math.cos(u) * Math.cos(v) * 700, Math.sin(v) * 700, Math.sin(u) * Math.cos(v) * 700);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame(() => {
    const n = night.current.v;
    if (stars.current) stars.current.opacity = n * 0.9;
    if (sky.current) sky.current.uniforms.uNight.value = n;
  });

  return (
    <group>
      <mesh scale={900} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial ref={sky} side={THREE.BackSide} depthWrite={false} fog={false} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={{ uNight: { value: 0 }, uSun: { value: sunDir } }} />
      </mesh>
      <points geometry={starGeo}>
        <pointsMaterial ref={stars} size={1.6} sizeAttenuation={false} color="#dfe8ff" transparent opacity={0} fog={false} depthWrite={false} />
      </points>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} material={m.city} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      {/* La torre bajo el penthouse */}
      <B p={[11, -51.2, 4.5]} s={[22.6, 101.4, 19.8]} m={m.tower} cast={false} />
      <mesh position={[11, -102, 4]} rotation={[-Math.PI / 2, 0, 0]} material={m.ground}><planeGeometry args={[2400, 2400]} /></mesh>
    </group>
  );
}

/* ───────────── Iluminación día / noche ───────────── */

const LAMPS: { p: V3; i: number; c: string; d?: number }[] = [
  { p: [5.0, 1.9, 2.5], i: 9, c: '#ffc98a' },
  { p: [5.5, 2.9, 5.2], i: 7, c: '#ffd7a3', d: 10 },
  { p: [0.8, 0.7, 4], i: 3, c: '#ff8f3a', d: 5 },
  { p: [17.2, 2.2, 5.0], i: 10, c: '#ffcd8f' },
  { p: [16.5, 2.1, 2.3], i: 7, c: '#ffd29a' },
  { p: [0.7, 1.0, 11], i: 6, c: '#ffc78a', d: 6 },
  { p: [10.5, 1.7, 10.6], i: 5, c: '#fff0dc', d: 5 },
  { p: [14.6, 2.8, 9.6], i: 7, c: '#ffd8a8', d: 7 },
  { p: [18.4, 1.4, 12.8], i: 5, c: '#ffcf96', d: 6 },
  { p: [16.5, -0.4, -3.8], i: 9, c: '#4fd6ef', d: 9 },
  { p: [11, 2.9, -1.2], i: 8, c: '#ffd29a', d: 12 },
  { p: [13.5, 2.5, 15.0], i: 3, c: '#fff0dc', d: 4 },
];

function Lighting({ night, quality }: { night: MutableRefObject<{ v: number }>; quality: 'alta' | 'ligera' }) {
  const m = useMats();
  const { gl, scene } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const lamps = useRef<(THREE.PointLight | null)[]>([]);
  const fogDay = useMemo(() => new THREE.Color('#d9d3c8'), []);
  const fogNight = useMemo(() => new THREE.Color('#0d1622'), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.fog = new THREE.Fog('#d9d3c8', 80, 620);
    const target = sun.current?.target;
    if (target) { target.position.set(11, 0, 5); scene.add(target); }
    return () => { scene.fog = null; if (target) scene.remove(target); };
  }, [scene]);

  useFrame(() => {
    const n = night.current.v;
    const e = THREE.MathUtils.smoothstep(n, 0, 1);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(1.35, 0.05, e);
    if (sun.current) sun.current.intensity = THREE.MathUtils.lerp(3.2, 0, Math.min(1, e * 1.6));
    lamps.current.forEach((l, i) => { if (l) l.intensity = LAMPS[i].i * (i === 2 ? 0.35 + 0.65 * e : e); });
    m.lamp.emissiveIntensity = THREE.MathUtils.lerp(0.15, 2.6, e);
    m.cove.emissiveIntensity = THREE.MathUtils.lerp(0, 2.2, e);
    m.water.emissiveIntensity = THREE.MathUtils.lerp(0, 0.55, e);
    m.cava.emissiveIntensity = THREE.MathUtils.lerp(0.06, 1.1, e);
    m.city.emissiveIntensity = e * 1.25;
    m.tower.emissiveIntensity = e * 0.9;
    m.ground.color.setRGB(0.36 - 0.33 * e, 0.38 - 0.34 * e, 0.36 - 0.31 * e);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(tmp.copy(fogDay).lerp(fogNight, e));
    scene.environmentIntensity = THREE.MathUtils.lerp(0.9, 0.12, e);
    gl.toneMappingExposure = THREE.MathUtils.lerp(1.0, 1.35, e);
  });

  const shadows = quality === 'alta';
  return (
    <>
      <hemisphereLight ref={hemi} args={['#e2ecf4', '#ebe4d8', 1.35]} />
      <directionalLight
        ref={sun}
        position={[-14, 22, -24]}
        intensity={3.2}
        color="#ffe2bf"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
      {LAMPS.map((l, i) => (
        <pointLight key={i} ref={(el) => { lamps.current[i] = el; }} position={l.p} color={l.c} intensity={0} distance={l.d ?? 8} decay={2} />
      ))}
    </>
  );
}

/* ───────────── Cámara: mirar alrededor y caminar entre espacios ───────────── */

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const near = (from: number, to: number) => from + wrap(to - from);
const yawTo = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

function CameraRig(props: {
  room: RoomId; intro: boolean; reduced: boolean; activeHotspot: string | null;
  viewer: MutableRefObject<Viewer | null>; fade: (mid: () => void) => void;
  onArrive: (id: RoomId) => void; onMoveStart: () => void;
  elevatorDoors: MutableRefObject<(THREE.Mesh | null)[]>;
}) {
  const { camera, gl } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const start = props.intro ? { x: ELEVATOR_START[0], z: ELEVATOR_START[1], yaw: 0 } : { x: roomById[props.room].cam[0], z: roomById[props.room].cam[2], yaw: roomById[props.room].yaw };
  const st = useRef({ ...start, tYaw: start.yaw, pitch: 0, tPitch: 0, vYaw: 0, vPitch: 0, moving: false, fov: cam.fov, baseFov: cam.fov, fovKick: 0, dragging: false, lx: 0, ly: 0 });
  const current = useRef<RoomId | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const cb = useRef(props);
  cb.current = props;

  // Entrada de punteros (ratón y táctil) y teclado
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'none';
    const s = st.current;
    const down = (e: PointerEvent) => { s.dragging = true; s.lx = e.clientX; s.ly = e.clientY; s.vYaw = 0; s.vPitch = 0; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => {
      if (!s.dragging || s.moving) return;
      const k = 0.0038 * (cam.fov / 70) * (e.pointerType === 'touch' ? 1.4 : 1);
      const dx = (e.clientX - s.lx) * k, dy = (e.clientY - s.ly) * k;
      s.tYaw += dx; s.tPitch = THREE.MathUtils.clamp(s.tPitch + dy, -0.85, 0.85);
      s.vYaw = dx; s.vPitch = dy;
      s.lx = e.clientX; s.ly = e.clientY;
    };
    const up = () => { s.dragging = false; el.style.cursor = 'grab'; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); s.baseFov = THREE.MathUtils.clamp(s.baseFov + e.deltaY * 0.02, 42, 82); };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
      const step = 0.16;
      if (e.key === 'ArrowLeft') { s.tYaw += step; e.preventDefault(); }
      if (e.key === 'ArrowRight') { s.tYaw -= step; e.preventDefault(); }
      if (e.key === 'ArrowUp') { s.tPitch = Math.min(0.85, s.tPitch + step / 2); e.preventDefault(); }
      if (e.key === 'ArrowDown') { s.tPitch = Math.max(-0.85, s.tPitch - step / 2); e.preventDefault(); }
      if (e.key === '+' || e.key === '=') s.baseFov = Math.max(42, s.baseFov - 4);
      if (e.key === '-') s.baseFov = Math.min(82, s.baseFov + 4);
    };
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', key);
    };
  }, [gl, cam]);

  // Cambios de habitación
  useEffect(() => {
    const s = st.current;
    const target = roomById[props.room];
    const from = current.current;
    tl.current?.kill();

    const arrive = () => { s.moving = false; current.current = target.id; cb.current.onArrive(target.id); };
    const teleport = () => {
      s.x = target.cam[0]; s.z = target.cam[2]; s.yaw = s.tYaw = target.yaw; s.pitch = s.tPitch = 0;
    };

    // Primera entrada: desde el elevador privado
    if (from === null) {
      if (props.intro && !props.reduced) {
        s.moving = true;
        cb.current.onMoveStart();
        const doors = props.elevatorDoors.current;
        const t = gsap.timeline({ delay: 0.9, onComplete: arrive });
        t.to(doors[0]?.position ?? {}, { x: '-=0.98', duration: 1.6, ease: 'power2.inOut' }, 0)
          .to(doors[1]?.position ?? {}, { x: '+=0.98', duration: 1.6, ease: 'power2.inOut' }, 0)
          .to(s, { z: 12.9, duration: 2.4, ease: 'power1.inOut' }, 1.1)
          .to(s, { x: target.cam[0], z: target.cam[2], duration: 1.4, ease: 'power2.out' }, 3.1)
          .to(s, { yaw: near(s.yaw, target.yaw), tYaw: near(s.yaw, target.yaw), duration: 2.2, ease: 'power2.inOut' }, 2.4);
        tl.current = t;
      } else {
        if (props.intro) props.elevatorDoors.current.forEach((d, k) => { if (d) d.position.x += k ? 0.98 : -0.98; });
        teleport();
        arrive();
      }
      return;
    }
    if (from === target.id) { arrive(); return; }

    cb.current.onMoveStart();
    const fromRoom = roomById[from];
    const link = fromRoom.links.find((l) => l.to === target.id);

    // Habitaciones no contiguas o movimiento reducido: corte con fundido
    if (!link || props.reduced) {
      s.moving = true;
      cb.current.fade(() => { teleport(); arrive(); });
      return;
    }

    // Caminata: hasta el vano y luego al punto de vista del destino
    s.moving = true;
    s.vYaw = s.vPitch = 0;
    const [dx, dz] = link.pos;
    const d1 = Math.hypot(dx - s.x, dz - s.z);
    const d2 = Math.hypot(target.cam[0] - dx, target.cam[2] - dz);
    const t1 = THREE.MathUtils.clamp(d1 * 0.3, 0.6, 1.5);
    const t2 = THREE.MathUtils.clamp(d2 * 0.3, 0.7, 1.6);
    const yaw1 = near(s.yaw, yawTo(s.x, s.z, dx, dz));
    const yaw2 = near(yaw1, yawTo(dx, dz, target.cam[0], target.cam[2]));
    const yaw3 = near(yaw2, target.yaw);
    const t = gsap.timeline({ onComplete: arrive });
    t.to(s, { pitch: 0, tPitch: 0, duration: 0.5, ease: 'power2.out' }, 0)
      .to(s, { yaw: yaw1, tYaw: yaw1, duration: 0.55, ease: 'power2.inOut' }, 0)
      .to(s, { x: dx, z: dz, duration: t1, ease: 'power1.in' }, 0.25)
      .to(s, { fovKick: 6, duration: t1, ease: 'sine.inOut' }, 0.25)
      .to(s, { yaw: yaw2, tYaw: yaw2, duration: 0.5, ease: 'sine.inOut' }, 0.25 + t1 - 0.25)
      .to(s, { x: target.cam[0], z: target.cam[2], duration: t2, ease: 'power2.out' }, 0.25 + t1)
      .to(s, { fovKick: 0, duration: t2, ease: 'sine.inOut' }, 0.25 + t1)
      .to(s, { yaw: yaw3, tYaw: yaw3, duration: t2 + 0.3, ease: 'power2.inOut' }, 0.25 + t1 + 0.1);
    tl.current = t;
  }, [props.room]);

  // Girar hacia un punto de interés
  useEffect(() => {
    if (!props.activeHotspot) return;
    const r = roomById[props.room];
    const h = r.hotspots.find((x) => x.id === props.activeHotspot);
    const s = st.current;
    if (!h || s.moving) return;
    const ty = near(s.tYaw, yawTo(s.x, s.z, h.pos[0], h.pos[2]));
    const tp = Math.atan2(h.pos[1] - EYE, Math.hypot(h.pos[0] - s.x, h.pos[2] - s.z));
    s.vYaw = s.vPitch = 0;
    gsap.to(s, { tYaw: ty, tPitch: THREE.MathUtils.clamp(tp, -0.7, 0.7), duration: props.reduced ? 0 : 1.1, ease: 'power3.inOut' });
  }, [props.activeHotspot]);

  useEffect(() => () => { tl.current?.kill(); }, []);

  useFrame((_, dt) => {
    const s = st.current;
    if (!s.moving) {
      if (!s.dragging) {
        s.tYaw += s.vYaw; s.tPitch = THREE.MathUtils.clamp(s.tPitch + s.vPitch, -0.85, 0.85);
        s.vYaw *= 0.9; s.vPitch *= 0.9;
      }
      const k = 1 - Math.exp(-dt * 9);
      s.yaw += (s.tYaw - s.yaw) * k;
      s.pitch += (s.tPitch - s.pitch) * k;
    }
    camera.position.set(s.x, EYE, s.z);
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');
    const f = s.baseFov + s.fovKick;
    if (Math.abs(cam.fov - f) > 0.01) { cam.fov += (f - cam.fov) * (1 - Math.exp(-dt * 6)); cam.updateProjectionMatrix(); }
    props.viewer.current = { x: s.x, z: s.z, yaw: s.yaw };
  });

  return null;
}

/* ───────────── Puntos interactivos dentro de la escena ───────────── */

function Markers({ room, settled, activeHotspot, onHotspot, onNavigate }: { room: RoomId; settled: boolean; activeHotspot: string | null; onHotspot: (h: Hotspot) => void; onNavigate: (id: RoomId) => void }) {
  if (!settled) return null;
  const r = roomById[room];
  return (
    <>
      {r.hotspots.map((h, i) => (
        <Html key={`${room}-${h.id}`} position={h.pos} center zIndexRange={[30, 10]}>
          <button
            type="button"
            className="tour-hotspot"
            data-active={activeHotspot === h.id}
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={() => onHotspot(h)}
            aria-label={`${h.kind}: ${h.title}`}
            aria-pressed={activeHotspot === h.id}
          >
            <span className="tour-hotspot-dot" />
            <span className="tour-hotspot-label">{h.title}</span>
          </button>
        </Html>
      ))}
      {r.links.map((l, i) => (
        <Html key={`${room}-link-${l.to}`} position={[l.pos[0], 1.05, l.pos[1]]} center zIndexRange={[30, 10]}>
          <button type="button" className="tour-link" style={{ animationDelay: `${200 + i * 90}ms` }} onClick={() => onNavigate(l.to)}>
            <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 38V12M7 12A26 26 0 0 1 33 38" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>
            Ir a {roomById[l.to].name.toLowerCase()}
          </button>
        </Html>
      ))}
    </>
  );
}

/* ───────────── Escena ───────────── */

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

function World(props: SceneProps & { settled: boolean }) {
  const mats = useMemo(createMaterials, []);
  const night = useRef({ v: props.night ? 1 : 0 });
  const elevatorDoors = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    gsap.to(night.current, { v: props.night ? 1 : 0, duration: props.reduced ? 0 : 2.6, ease: 'power2.inOut' });
  }, [props.night]);

  useEffect(() => () => {
    Object.values(mats).forEach((m) => { if (m instanceof THREE.Material) { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); } });
  }, [mats]);

  return (
    <MatCtx.Provider value={mats}>
      <Lighting night={night} quality={props.quality} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 5, -10]} scale={[20, 6, 1]} color="#fff4e6" />
        <Lightformer form="rect" intensity={0.6} position={[10, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color="#dfe9f2" />
        <Lightformer form="ring" intensity={1.2} position={[-6, 4, 6]} scale={3} color="#ffd9a6" />
      </Environment>
      <City count={props.quality === 'alta' ? 260 : 140} night={night} />
      <Walls elevatorDoors={elevatorDoors} />
      <Sala />
      <Cocina />
      <Recamara />
      <Bano />
      <Vestibulo />
      <Estudio />
      <Terraza />
      <CameraRig
        room={props.room} intro={props.intro} reduced={props.reduced} activeHotspot={props.activeHotspot}
        viewer={props.viewer} fade={props.fade} onArrive={props.onArrive} onMoveStart={props.onMoveStart} elevatorDoors={elevatorDoors}
      />
      <Markers room={props.room} settled={props.settled} activeHotspot={props.activeHotspot} onHotspot={props.onHotspot} onNavigate={props.onNavigate} />
      <Ready onReady={props.onReady} />
    </MatCtx.Provider>
  );
}

export default function Scene(props: SceneProps) {
  const [settled, setSettled] = useState(false);
  const [dpr, setDpr] = useState<number>(props.quality === 'alta' ? Math.min(1.75, window.devicePixelRatio) : 1);
  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const startRoom = roomById[props.room];

  return (
    <Canvas
      shadows={props.quality === 'alta' ? { type: THREE.PCFShadowMap } : false}
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: portrait ? 78 : 66, near: 0.05, far: 2000, position: [startRoom.cam[0], EYE, startRoom.cam[2]] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
      aria-label="Maqueta 3D del Ático Lumen. Arrastra para mirar alrededor."
    >
      <PerformanceMonitor onDecline={() => { setDpr(1); props.onQualityDrop(); }} />
      <World
        {...props}
        settled={settled}
        onArrive={(id) => { setSettled(true); props.onArrive(id); }}
        onMoveStart={() => { setSettled(false); props.onMoveStart(); }}
      />
    </Canvas>
  );
}

export { rooms };

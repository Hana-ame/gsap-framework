import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EventBus } from '../../pixi/EventBus';

type SceneHandle = {
  destroy: () => void;
  setColor: (c: number) => void;
  setRotation: (rad: number) => void;
};

type SceneCtx = {
  scene: THREE.Scene;
  dispose: () => void;
};

type Pos = { x: number; y: number };

export function Two3DDisplay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const bus = new EventBus();
    const cleanups: (() => void)[] = [];

    const canvasA = ref.current.querySelector<HTMLCanvasElement>('canvas[data-3d="a"]');
    const canvasB = ref.current.querySelector<HTMLCanvasElement>('canvas[data-3d="b"]');
    if (!canvasA || !canvasB) return;

    const a = mountTorusScene(canvasA);
    const b = mountIcoScene(canvasB);
    cleanups.push(a.destroy, b.destroy);

    const offColor = bus.on<number>('pick-color', (c) => {
      a.setColor(c);
      b.setColor(c);
    });
    const offRotate = bus.on<number>('rotate-a', (r) => {
      a.setRotation(r);
    });
    cleanups.push(offColor, offRotate);

    canvasA.addEventListener('click', () => {
      bus.emit('pick-color', Math.floor(Math.random() * 0xffffff));
    });
    canvasB.addEventListener('click', () => {
      bus.emit('rotate-a', Math.random() * Math.PI * 2);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={ref} style={container}>
      <DraggableWindow
        title="A · TorusKnot (click → recolor both)"
        dataAttr="a"
        initial={{ x: 24, y: 32 }}
      />
      <DraggableWindow
        title="B · Icosahedron (click → rotate A)"
        dataAttr="b"
        initial={{ x: 360, y: 96 }}
      />
    </div>
  );
}

const container: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#0a0a12',
  overflow: 'hidden',
};

const WINDOW_W = 320;
const WINDOW_H = 260;

function DraggableWindow({
  title,
  dataAttr,
  initial,
}: {
  title: string;
  dataAttr: string;
  initial: Pos;
}) {
  const [pos, setPos] = useState<Pos>(initial);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setPos({
      x: d.ox + (e.clientX - d.sx),
      y: d.oy + (e.clientY - d.sy),
    });
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  return (
    <div
      style={{
        ...windowFrame,
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: WINDOW_W,
        height: WINDOW_H,
      }}
    >
      <div
        style={{ ...titleBar, cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {title}
      </div>
      <div style={content}>
        <canvas data-3d={dataAttr} style={canvasStyle} />
      </div>
    </div>
  );
}

const windowFrame: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #2a2a3a',
  borderRadius: 4,
  overflow: 'hidden',
  background: '#0d0d18',
  minWidth: 0,
  minHeight: 0,
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
};

const titleBar: CSSProperties = {
  padding: '6px 10px',
  background: '#1a1a2a',
  color: '#999',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  borderBottom: '1px solid #2a2a3a',
  userSelect: 'none',
};

const content: CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
};

const canvasStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

function makeScene(canvas: HTMLCanvasElement): SceneCtx {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d18);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(2.2, 1.6, 3.2);

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 6, 5);
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
  fill.position.set(-4, 2, -3);
  scene.add(fill);

  const grid = new THREE.GridHelper(10, 10, 0x333355, 0x222244);
  scene.add(grid);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.target.set(0, 0.8, 0);

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let raf = 0;
  const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    scene,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      renderer.dispose();
    },
  };
}

function mountTorusScene(canvas: HTMLCanvasElement): SceneHandle {
  const ctx = makeScene(canvas);
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.7, 0.22, 200, 32),
    new THREE.MeshStandardMaterial({ color: 0xff6688, roughness: 0.3, metalness: 0.7 }),
  );
  mesh.position.y = 0.9;
  ctx.scene.add(mesh);
  return {
    destroy: ctx.dispose,
    setColor: (c) => (mesh.material as THREE.MeshStandardMaterial).color.setHex(c),
    setRotation: (rad) => {
      mesh.rotation.y = rad;
    },
  };
}

function mountIcoScene(canvas: HTMLCanvasElement): SceneHandle {
  const ctx = makeScene(canvas);
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 0),
    new THREE.MeshStandardMaterial({
      color: 0x6688ff,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true,
    }),
  );
  mesh.position.y = 0.9;
  ctx.scene.add(mesh);
  return {
    destroy: ctx.dispose,
    setColor: (c) => (mesh.material as THREE.MeshStandardMaterial).color.setHex(c),
    setRotation: () => {},
  };
}

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Window } from '../../ui/Window';

type SceneHandle = {
  destroy: () => void;
  setColor: (c: number) => void;
  setRotation: (rad: number) => void;
};

type SceneCtx = {
  scene: THREE.Scene;
  dispose: () => void;
};

export function Two3DDisplay() {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cleanups: (() => void)[] = [];

    const canvasA = ref.current.querySelector<HTMLCanvasElement>('canvas[data-3d="a"]');
    const canvasB = ref.current.querySelector<HTMLCanvasElement>('canvas[data-3d="b"]');
    if (!canvasA || !canvasB) return;

    const a = mountTorusScene(canvasA);
    const b = mountIcoScene(canvasB);
    cleanups.push(a.destroy, b.destroy);

    canvasA.addEventListener('click', () => {
      a.setColor(Math.floor(Math.random() * 0xffffff));
    });
    canvasB.addEventListener('click', () => {
      b.setColor(Math.floor(Math.random() * 0xffffff));
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={ref} style={container}>
      <Window
        id="a"
        title="A · TorusKnot"
        initial={{ x: 24, y: 32 }}
        width={320}
        height={260}
        zIndex={focused === 'a' ? 10 : 1}
        onFocus={() => setFocused('a')}
      >
        <canvas data-3d="a" style={canvasStyle} />
      </Window>
      <Window
        id="b"
        title="B · Icosahedron"
        initial={{ x: 360, y: 96 }}
        width={320}
        height={260}
        zIndex={focused === 'b' ? 10 : 1}
        onFocus={() => setFocused('b')}
      >
        <canvas data-3d="b" style={canvasStyle} />
      </Window>
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

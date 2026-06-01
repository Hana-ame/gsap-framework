import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function ThreeEulerDisplay() {
  const hostRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const hud = hudRef.current;
    if (!host || !hud) return;

    const W = host.clientWidth || window.innerWidth;
    const H = host.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H, false);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(2.6, 1.8, 3.6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    scene.add(new THREE.GridHelper(8, 8, 0x334455, 0x223344));

    const ship = new THREE.Group();
    ship.position.y = 0.3;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, 1),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4, metalness: 0.6 }),
    );
    ship.add(body);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xff4488, roughness: 0.3, metalness: 0.7 }),
    );
    nose.position.z = 0.6;
    nose.rotation.x = Math.PI / 2;
    ship.add(nose);

    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x66aaff, roughness: 0.5, metalness: 0.5 }),
    );
    wingL.position.set(-0.45, 0, 0);
    ship.add(wingL);
    const wingR = wingL.clone();
    wingR.position.x = 0.45;
    ship.add(wingR);

    ship.add(new THREE.AxesHelper(0.7));
    scene.add(ship);

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    ship.rotation.copy(euler);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set(0, 0.3, 0);

    const PITCH_MAX = THREE.MathUtils.degToRad(85);
    const LOCK_THRESHOLD = THREE.MathUtils.degToRad(89);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      euler.set(
        Math.sin(t * 0.3) * PITCH_MAX,
        t * 0.5,
        Math.sin(t * 0.7) * 0.5,
      );
      ship.rotation.copy(euler);

      const pitchDeg = euler.x * 180 / Math.PI;
      const yawDeg = (((euler.y * 180 / Math.PI) % 360) + 360) % 360;
      const rollDeg = euler.z * 180 / Math.PI;
      const status =
        Math.abs(pitchDeg) > LOCK_THRESHOLD * (180 / Math.PI)
          ? '⚠ near gimbal lock'
          : '✓ safe (YXZ order + pitch clamp)';

      hud.textContent =
        `Euler order: YXZ  (yaw-pitch-roll)\n` +
        `Pitch clamped to ±85°\n` +
        `\n` +
        `  pitch (X): ${pitchDeg.toFixed(1).padStart(7)}°\n` +
        `  yaw   (Y): ${yawDeg.toFixed(1).padStart(7)}°\n` +
        `  roll  (Z): ${rollDeg.toFixed(1).padStart(7)}°\n` +
        `\n` +
        `  ${status}`;

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
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
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={hostRef} style={hostStyle}>
      <div ref={hudRef} style={hudStyle} />
    </div>
  );
}

const hostStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#0a0a14',
  overflow: 'hidden',
};

const hudStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.6)',
  color: '#aabbcc',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  borderRadius: 4,
  whiteSpace: 'pre',
  pointerEvents: 'none',
  zIndex: 10,
};

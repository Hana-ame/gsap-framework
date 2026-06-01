import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';

export function CameraEulerDisplay() {
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
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 1.2, 5);
    camera.rotation.order = 'YXZ';

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    scene.add(new THREE.AxesHelper(2));
    scene.add(new THREE.GridHelper(20, 20, 0x334455, 0x223344));

    const target = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff4488, roughness: 0.4, metalness: 0.5 }),
    );
    target.position.set(0, 0.5, 0);
    scene.add(target);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 3.5;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.2, 0.4),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(i / 8, 0.6, 0.55),
          roughness: 0.5,
          metalness: 0.4,
        }),
      );
      m.position.set(Math.cos(angle) * r, 0.6, Math.sin(angle) * r);
      scene.add(m);
    }

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 4),
      new THREE.MeshStandardMaterial({ color: 0x223344, side: THREE.DoubleSide }),
    );
    wall.position.set(0, 2, -8);
    scene.add(wall);

    const PITCH_MAX = THREE.MathUtils.degToRad(80);

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
      const pitch = Math.sin(t * 0.3) * PITCH_MAX;
      const yaw = t * 0.4;
      const roll = Math.sin(t * 0.7) * THREE.MathUtils.degToRad(20);
      camera.rotation.set(pitch, yaw, roll, 'YXZ');

      const pitchDeg = pitch * 180 / Math.PI;
      const yawDeg = (((yaw * 180 / Math.PI) % 360) + 360) % 360;
      const rollDeg = roll * 180 / Math.PI;
      const status = Math.abs(pitchDeg) > 85 ? 'near gimbal lock' : 'safe (YXZ + pitch clamp)';
      hud.textContent =
        `Camera Euler (YXZ order, pitch clamped +/-80)\n` +
        `\n` +
        `  pitch (X): ${pitchDeg.toFixed(1).padStart(7)}\u00b0\n` +
        `  yaw   (Y): ${yawDeg.toFixed(1).padStart(7)}\u00b0\n` +
        `  roll  (Z): ${rollDeg.toFixed(1).padStart(7)}\u00b0\n` +
        `\n` +
        `  ${status}\n` +
        `  pos: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      renderer.dispose();
      if (canvas.parentNode === host) {
        host.removeChild(canvas);
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

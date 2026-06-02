import { useEffect } from 'react';
import * as THREE from 'three';
import { start3DApp } from '../../three/start3DApp';

const HUES = [0x66aaff, 0xff6688, 0x88ff66, 0xffcc44, 0xcc66ff, 0x66ffcc, 0xff8866, 0x88ddff];
const MAX_SPAWN = 60;

export function ThreeDisplay() {
  useEffect(() => {
    let hud: HTMLDivElement | null = null;
    let downX = 0;
    let downY = 0;

    const destroy = start3DApp((api) => {
      const { scene, renderer } = api;

      const ambient = new THREE.AmbientLight(0xffffff, 0.45);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(6, 10, 4);
      scene.add(dir);
      const fill = new THREE.DirectionalLight(0x6688ff, 0.3);
      fill.position.set(-5, 3, -4);
      scene.add(fill);

      const grid = new THREE.GridHelper(20, 20, 0x445577, 0x222244);
      grid.position.y = 0.001;
      scene.add(grid);

      const central = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.9, 0),
        new THREE.MeshStandardMaterial({ color: 0xffaa55, flatShading: true, metalness: 0.2, roughness: 0.6 }),
      );
      central.position.y = 1;
      scene.add(central);

      const ring: THREE.Mesh[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          new THREE.MeshStandardMaterial({ color: HUES[i], metalness: 0.1, roughness: 0.5 }),
        );
        cube.position.set(Math.cos(a) * 3.2, 0.45, Math.sin(a) * 3.2);
        scene.add(cube);
        ring.push(cube);
      }

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const spawned: THREE.Mesh[] = [];
      const spawn = (x: number, z: number) => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.6, 0.6),
          new THREE.MeshStandardMaterial({ color: HUES[spawned.length % HUES.length], metalness: 0.1, roughness: 0.5 }),
        );
        m.position.set(x, 0.3, z);
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        scene.add(m);
        spawned.push(m);
        if (spawned.length > MAX_SPAWN) {
          const old = spawned.shift();
          if (old) {
            scene.remove(old);
            old.geometry.dispose();
            (old.material as THREE.Material).dispose();
          }
        }
      };

      const onDown = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };
      const onUp = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const py = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        api.raycaster.setFromCamera(new THREE.Vector2(px, py), api.camera);
        const hit = new THREE.Vector3();
        if (api.raycaster.ray.intersectPlane(groundPlane, hit)) {
          spawn(hit.x, hit.z);
        }
      };
      renderer.domElement.addEventListener('pointerdown', onDown);
      renderer.domElement.addEventListener('pointerup', onUp);

      const baseUpdate = api.controls.update.bind(api.controls);
      api.controls.update = (): boolean => {
        const moved = baseUpdate();
        const t = performance.now() * 0.001;
        central.rotation.x = t * 0.4;
        central.rotation.y = t * 0.28;
        ring.forEach((c, i) => {
          c.position.y = 0.45 + Math.sin(t * 1.3 + i) * 0.25;
          c.rotation.y = t * 0.6 + i;
        });
        spawned.forEach((m, i) => {
          m.rotation.y += 0.01;
          m.position.y = 0.3 + Math.sin(t * 1.5 + i) * 0.05;
        });
        return moved;
      };

      hud = document.createElement('div');
      hud.style.cssText =
        'position:fixed;top:0;left:0;padding:10px 12px;color:#aac6ff;' +
        'font:12px ui-monospace,monospace;pointer-events:none;z-index:10;' +
        'text-shadow:0 1px 2px rgba(0,0,0,0.8);line-height:1.5;';
      hud.innerHTML =
        '#three — drag to orbit • scroll to zoom • click ground to spawn cube<br>' +
        '<span style="opacity:0.6">three@0.184.0 + addons OrbitControls</span>';
      document.body.appendChild(hud);
    });

    return () => {
      destroy();
      if (hud && hud.parentNode) hud.parentNode.removeChild(hud);
    };
  }, []);

  return null;
}

ThreeDisplay.head = {
  title: '3D Scene — sim',
  description: 'Three.js scene — Icosahedron + 8 bouncing cubes + click ground to spawn (FIFO 60).',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};

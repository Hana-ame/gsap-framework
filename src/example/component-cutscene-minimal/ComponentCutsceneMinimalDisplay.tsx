import { useEffect } from 'react';
import * as PIXI from 'pixi.js';

const STABLE_MP4_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';

export function ComponentCutsceneMinimalDisplay() {
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const app = new PIXI.Application();
    let destroyed = false;

    app
      .init({
        width: W,
        height: H,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl',
        hello: false,
      })
      .then(() => {
        if (destroyed) {
          app.destroy(true, { children: true, texture: true });
          return;
        }
        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        document.body.appendChild(canvas);

        const videoElement = document.createElement('video');
        videoElement.src = STABLE_MP4_URL;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.crossOrigin = 'anonymous';

        const texture = PIXI.Texture.from(videoElement);
        const sprite = new PIXI.Sprite(texture);

        const vw = W;
        const vh = (W * 9) / 16;
        const vx = 0;
        const vy = (H - vh) / 2;
        if (vh > H) {
          sprite.width = (H * 16) / 9;
          sprite.height = H;
          sprite.x = (W - sprite.width) / 2;
          sprite.y = 0;
        } else {
          sprite.width = vw;
          sprite.height = vh;
          sprite.x = vx;
          sprite.y = vy;
        }

        app.stage.addChild(sprite);

        videoElement.addEventListener('loadedmetadata', () => {
          console.log(`[Minimal] loadedmetadata duration=${videoElement.duration}`);
        });
        videoElement.addEventListener('canplay', () => {
          console.log('[Minimal] canplay');
        });
        videoElement.addEventListener('play', () => {
          console.log('[Minimal] play event');
        });
        videoElement.addEventListener('pause', () => {
          console.log('[Minimal] pause event');
        });
        videoElement.addEventListener('ended', () => {
          console.log('[Minimal] ended event');
        });
        videoElement.addEventListener('error', () => {
          console.log(`[Minimal] error code=${videoElement.error?.code}`);
        });

        videoElement.play().then(
          () => console.log('[Minimal] play() resolved'),
          (e) => console.log(`[Minimal] play() rejected: ${e}`),
        );
      });

    return () => {
      destroyed = true;
      try {
        app.destroy(true, { children: true, texture: true });
      } catch {
        // ignore
      }
    };
  }, []);

  return <></>;
}

ComponentCutsceneMinimalDisplay.head = {
  title: 'Component: Cutscene (Minimal)',
  description: 'Sanity test: single raw PIXI.Application + HTML5 <video> + Texture.from(video) + Sprite. Bypasses SubCanvas and createVideoPlayer to isolate the question "does PIXI v8 video work at all here?".',
};

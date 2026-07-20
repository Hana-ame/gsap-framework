// Example: Stream adapter for SubCanvas data streaming
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { textPresets } from '@components';
import { MockBackend, ContentChannel } from '../../backend';
import { ContentChannelAdapter } from '../../adapters';

const LOREM_IPSUM = [
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem',
  'accusantium doloremque laudantium, totam rem aperiam, eaque',
  'ipsa quae ab illo inventore veritatis et quasi architecto',
  'beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem',
  'quia voluptas sit aspernatur aut odit aut fugit, sed quia',
  'consequuntur magni dolores eos qui ratione voluptatem sequi',
  'nesciunt. Neque porro quisquam est, qui dolorem ipsum quia',
  'dolor sit amet, consectetur, adipisci velit, sed quia non',
  'numquam eius modi tempora incidunt ut labore et dolore',
  'magnam aliquam quaerat voluptatem.',
];

export function StreamAdapterDisplay() {
  useEffect(() => {
    const backend = new MockBackend();
    let cc: ContentChannel | null = null;
    let ccAdapter: ContentChannelAdapter | null = null;
    let root: SubCanvas | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'ContentChannelAdapter — streamed content assembly',
        style: textPresets.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      const info = new PIXI.Text({
        text: 'backend streams chunks with seq numbers; ContentChannel assembles on done; adapter renders',
        style: { fontSize: 12, fill: 0x888888, fontFamily: 'sans-serif' },
      });
      info.x = 12;
      info.y = 36;
      root.stage.addChild(info);

      const displayBox = new PIXI.Graphics()
        .rect(12, 60, W - 24, 200)
        .fill({ color: 0x0a0a1e, alpha: 0.8 });
      displayBox.eventMode = 'none';
      root.stage.addChild(displayBox);

      const streamStage = root.createRegion({ x: 12, y: 60, width: W - 24, height: 200 }, { clipToBounds: true });

      const label = new PIXI.Text({
        text: 'status: waiting for connection...',
        style: { fontSize: 11, fill: 0xff8844, fontFamily: 'monospace' },
      });
      label.x = 16;
      label.y = 272;
      root.stage.addChild(label);

      backend.on('status', (s) => {
        label.text = `status: ${s}`;
      });

      backend.connect(400);

      cc = new ContentChannel(backend);
      ccAdapter = new ContentChannelAdapter(cc);
      ccAdapter.attachStage('stream-doc', streamStage);

      cc.onMessage((msg) => {
        label.text = `receiving chunk ${msg.seq + 1}/${msg.total}...`;
      });

      setTimeout(() => {
        cc.simulateStream('stream-doc', LOREM_IPSUM, 120);
      }, 800);

      setTimeout(() => {
        label.text = 'stream complete — text assembled and displayed';
      }, 800 + LOREM_IPSUM.length * 120 + 200);

      proxy.onWindowResize(() => {
        root?.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      ccAdapter?.destroy();
      cc?.destroy();
      backend.destroy();
      stop();
    };
  }, []);

  return null;
}

StreamAdapterDisplay.head = {
  title: 'Stream Adapter',
  description: 'ContentChannelAdapter: backend streams multi-chunk content assembled by ContentChannel and rendered by adapter.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

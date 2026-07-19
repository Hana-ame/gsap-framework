import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, TXT, makeInfoPanel, type SubCanvasProxy } from '../../framework';
import { createTextInput, type TextInputHandle } from '../../components/TextInput';

export function ComponentTextInputDisplay() {
  const inputsRef = useRef<TextInputHandle[]>([]);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(sc, {
        title: '文本输入',
        lines: [
          '用途：画布文本输入框——文本、密码、最大长度、预填充等变体。',
          '测试方法：点击输入框获得焦点，输入文本，按回车提交，按 Esc 取消焦点。',
          '预期：焦点框显示光标，密码字符被遮蔽，maxLength 达到限制停止输入，onChange 每次按键触发，onSubmit 在回车时触发。',
        ],
        x: window.innerWidth - 400,
        y: window.innerHeight - 150,
      });

      const header = new PIXI.Text({
        text: 'TextInput — click to focus, Enter to submit, Esc to blur, placeholder + password + maxLength',
        style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 40;
      header.y = 24;
      header.eventMode = 'none';
      sc.stage.addChild(header);

      const allInputs: TextInputHandle[] = [];
      let y = 72;

      const addRow = (label: string, input: TextInputHandle) => {
        const lbl = new PIXI.Text({
          text: label,
          style: TXT.label,
        });
        lbl.x = 40;
        lbl.y = y + 6;
        lbl.eventMode = 'none';
        sc.stage.addChild(lbl);

        input.stage.x = 220;
        input.stage.y = y;
        sc.stage.addChild(input.stage);
        allInputs.push(input);
        y += 50;
      };

      const log = new PIXI.Text({
        text: 'ready',
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace' },
      });
      log.x = 40;
      log.y = y + 10;
      log.eventMode = 'none';
      sc.stage.addChild(log);

      addRow('text', createTextInput(sc.stage, {
        x: 0, y: 0, width: 300, height: 34,
        placeholder: 'type something…',
        onChange: (v) => { log.text = `onChange: "${v}"`; },
        onSubmit: (v) => { log.text = `onSubmit: "${v}"`; },
      }));

      addRow('password', createTextInput(sc.stage, {
        x: 0, y: 0, width: 300, height: 34,
        placeholder: 'password',
        password: true,
        onChange: (v) => { log.text = `password chars: ${v.length}`; },
      }));

      addRow('maxLength(6)', createTextInput(sc.stage, {
        x: 0, y: 0, width: 300, height: 34,
        placeholder: 'max 6 chars',
        maxLength: 6,
        onChange: (v) => { log.text = `text: "${v}"`; },
      }));

      addRow('pre-filled', createTextInput(sc.stage, {
        x: 0, y: 0, width: 300, height: 34,
        value: 'hello world',
        onChange: (v) => { log.text = `text: "${v}"`; },
      }));

      inputsRef.current = allInputs;
    });
    return () => {
      inputsRef.current.forEach((i) => i.destroy());
      stop();
    };
  }, []);

  return null;
}

ComponentTextInputDisplay.head = {
  title: 'Component: TextInput',
  description: 'Canvas text input — text, password, maxLength, placeholder, pre-filled, onChange/onSubmit.',
};

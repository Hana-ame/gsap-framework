import React, { useState, useEffect } from 'react';
import { PixiExample } from './pixijs/PixiExample';
import { webSocketDataSource } from './websocket/webSocketDataSource';
import { TestDataSource } from './test/testDataSource';
import type{ DataSource } from './pixijs/dataSource';

function App() {
  const [useTest, setUseTest] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>(webSocketDataSource);

  useEffect(() => {
    if (useTest) {
      const testDs = new TestDataSource();
      setDataSource(testDs);
      return () => {
        testDs.destroy(); // 清理定时器
      };
    } else {
      setDataSource(webSocketDataSource);
    }
  }, [useTest]);

  return (
    <div>
      <button onClick={() => setUseTest(!useTest)}>
        切换到 {useTest ? 'WebSocket' : '测试'} 数据源
      </button>
      <PixiExample dataSource={dataSource} />
    </div>
  );
}

export default App;

import asyncio
import json
from typing import Dict, List
from dataclasses import dataclass, asdict
import struct
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# ---- 1. 定义核心数据结构 ----
@dataclass
class Unit:
    """代表一个游戏单位"""
    id: int          # 单位ID (0-9999)
    x: int           # x坐标 (int16范围)
    y: int           # y坐标 (int16范围)
    # 可在此扩展更多字段，如朝向、血量等
    # rotation: int = 0

@dataclass
class GameState:
    """代表一帧完整的游戏状态"""
    units: List[Unit]  # 所有单位列表

class ConnectionManager:
    """管理所有活跃的WebSocket连接"""
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"用户 {user_id} 已连接。当前连接数: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"用户 {user_id} 已断开。当前连接数: {len(self.active_connections)}")

    async def broadcast_binary(self, data: bytes):
        """以二进制形式广播数据给所有客户端"""
        if not self.active_connections:
            return
        # 使用asyncio.gather并发发送，提高效率
        tasks = [asyncio.create_task(conn.send_bytes(data)) for conn in self.active_connections.values()]
        await asyncio.gather(*tasks, return_exceptions=True)

# ---- 2. 初始化服务器状态和单例 ----
manager = ConnectionManager()

# 初始化游戏世界：创建10000个静态单位（仅用于测试）
def init_world() -> GameState:
    units = []
    for i in range(10000):  # 创建1万个单位
        # 让单位分布在一个 300x300 的虚拟网格中，避免重叠
        units.append(Unit(id=i, x=(i % 300) * 10, y=(i // 300) * 10))
    return GameState(units=units)

game_state = init_world()

# ---- 3. 状态更新与广播任务 ----
def update_game_state():
    """更新游戏逻辑。这是全量更新的核心：移动所有单位。"""
    # 示例：让所有单位缓慢向右下方移动
    for unit in game_state.units:
        unit.x = (unit.x + 1) % 32767  # 模拟移动，避免溢出int16范围
        unit.y = (unit.y + 1) % 32767

def serialize_state_to_binary(state: GameState) -> bytes:
    """将游戏状态序列化为紧凑的二进制格式（你的int16方案）"""
    # 协议格式: [单位数量 (2字节)] + [单位1数据] + [单位2数据] + ...
    # 每个单位数据: ID (2字节) + X (2字节) + Y (2字节) = 6字节
    unit_count = len(state.units)
    # 'H' 代表无符号短整型 (2字节), 'h' 代表有符号短整型 (2字节)
    buffer = struct.pack(f'H', unit_count)  # 先打包数量
    for unit in state.units:
        # 打包每个单位的数据
        buffer += struct.pack('Hhh', unit.id, unit.x, unit.y)  # 注意：id用'H'，x,y用'h'
    return buffer

async def broadcast_state_periodically(interval: float = 0.1):  # 默认0.1秒，即10FPS
    """定期广播游戏状态"""
    while True:
        # 1. 更新游戏逻辑（如单位移动）
        update_game_state()

        # 2. 序列化当前状态
        binary_data = serialize_state_to_binary(game_state)

        # 3. 广播给所有客户端
        await manager.broadcast_binary(binary_data)

        # 4. 等待下一个更新周期
        await asyncio.sleep(interval)

# ---- 4. WebSocket 端点（基本是你原有的框架） ----
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        # 可以在这里接收客户端指令（例如移动某个单位）
        async for data in websocket.iter_text():
            # 示例：假设客户端发送 {"command": "move", "unit_id": 123, "x": 100, "y": 200}
            # 你可以在这里解析并调用 my_server.handle_incoming_message
            # 为简化测试，这里可以暂时留空或只打印日志
            print(f"收到来自 {user_id} 的消息: {data}")
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# ---- 5. 启动后台广播任务 ----
@app.on_event("startup")
async def startup_event():
    # 在FastAPI启动时，开始后台广播任务
    asyncio.create_task(broadcast_state_periodically(0.01))  # 10 FPS
    print("游戏状态广播任务已启动。")

@app.on_event("shutdown")
async def shutdown_event():
    print("服务器正在关闭...")
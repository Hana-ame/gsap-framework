import asyncio
from fastapi import WebSocket

class MyComplexServer:
    def __init__(self):
        # Store active connections: {user_id: websocket}
        self.active_connections: dict[str, WebSocket] = {}

        # Start a background task that belongs to the server
        # This simulates the server "deciding" to send data to clients
        asyncio.create_task(self._server_logic_loop())

    async def register(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"Server registered: {user_id}")
        # Send a welcome message immediately upon registration
        await websocket.send_text(f"Welcome {user_id}! You are now registered.")

    def unregister(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"Server unregistered: {user_id}")

    async def handle_incoming_message(self, user_id: str, message: str):
        """Logic for processing data sent BY the client"""
        print(f"Server received from {user_id}: {message}")

        # Example: if user sends "status", tell only them
        if message == "status":
            await self.active_connections[user_id].send_text("Server is Healthy")

    async def _server_logic_loop(self):
        """
        Background loop: The server autonomously sends data
        to all registered clients every 10 seconds.
        """
        while True:
            await asyncio.sleep(10)  # Wait 10 seconds
            if self.active_connections:
                print(f"Broadcasting heartbeat to {len(self.active_connections)} users")
                for user_id, ws in self.active_connections.items():
                    try:
                        await ws.send_text("Server Pulse: Still alive!")
                    except Exception:
                        # Handle cases where connection died but wasn't cleaned up
                        pass

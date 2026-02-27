from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from myserver import MyComplexServer

# 1. Create the single instance of your complex server
my_server = MyComplexServer()

app = FastAPI()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    # 2. Register the connection to the server instance
    await my_server.register(user_id, websocket)
    
    try:
        while True:
            # 3. Listen for messages and pass them to the server instance logic
            data = await websocket.receive_text()
            await my_server.handle_incoming_message(user_id, data)
            
    except WebSocketDisconnect:
        # 4. Clean up on disconnect
        my_server.unregister(user_id)
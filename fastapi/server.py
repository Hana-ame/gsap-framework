import asyncio
import json
import random
import websockets
import esper  # <--- esper module acts as the World now
from dataclasses import dataclass
from typing import Any

# --- CONSTANTS ---
WIDTH, HEIGHT = 800, 600
TICK_RATE = 60
dt = 1 / TICK_RATE


# --- COMPONENTS ---
@dataclass
class Position:
    x: float
    y: float


@dataclass
class Velocity:
    x: float
    y: float


@dataclass
class Player:
    socket: Any
    color: int
    inputs: dict
    cooldown: int = 0


@dataclass
class Bullet:
    owner_id: int
    lifetime: int


@dataclass
class Collider:
    radius: float


# --- SYSTEMS ---


class MovementSystem(esper.Processor):
    def process(self):
        # ERROR FIX: Use esper.get_components instead of self.world
        for ent, (pos, vel) in esper.get_components(Position, Velocity):
            pos.x += vel.x
            pos.y += vel.y

            # Simple Friction
            vel.x *= 0.95
            vel.y *= 0.95


class InputSystem(esper.Processor):
    def process(self):
        # ERROR FIX: Added 'Position' to the query so 'pos' is defined
        for ent, (pos, vel, player) in esper.get_components(Position, Velocity, Player):
            inp = player.inputs
            speed = 1.5

            if inp.get("w"):
                vel.y -= speed
            if inp.get("s"):
                vel.y += speed
            if inp.get("a"):
                vel.x -= speed
            if inp.get("d"):
                vel.x += speed

            # Shooting
            if inp.get(" "):
                if player.cooldown <= 0:
                    player.cooldown = 15
                    bx, by = (vel.x, vel.y)
                    mag = (bx**2 + by**2) ** 0.5

                    if mag < 0.1:
                        vx, vy = 0, -10
                    else:
                        vx, vy = (bx / mag) * 15, (by / mag) * 15

                    # ERROR FIX: Use esper.create_entity
                    esper.create_entity(
                        Position(pos.x, pos.y),  # <--- 'pos' now exists!
                        Velocity(vx, vy),
                        Bullet(owner_id=ent, lifetime=60),
                        Collider(radius=5),
                    )

            if player.cooldown > 0:
                player.cooldown -= 1


class BoundarySystem(esper.Processor):
    def process(self):
        for ent, (pos, vel, _) in esper.get_components(Position, Velocity, Player):
            if pos.x < 0 or pos.x > WIDTH:
                vel.x *= -1
                pos.x = max(0, min(pos.x, WIDTH))
            if pos.y < 0 or pos.y > HEIGHT:
                vel.y *= -1
                pos.y = max(0, min(pos.y, HEIGHT))

        to_delete = []
        for ent, (pos, bullet) in esper.get_components(Position, Bullet):
            bullet.lifetime -= 1
            if (
                pos.x < 0
                or pos.x > WIDTH
                or pos.y < 0
                or pos.y > HEIGHT
                or bullet.lifetime <= 0
            ):
                to_delete.append(ent)

        for ent in to_delete:
            if esper.entity_exists(ent):
                esper.delete_entity(ent)


class StateBroadcastSystem(esper.Processor):
    def __init__(self, loop):
        self.loop = loop

    def process(self):
        # Serialize World State
        entities_data = []

        # 2 Components: Use Unpacking (pos, player)
        for ent, (pos, player) in esper.get_components(Position, Player):
            entities_data.append(
                {
                    "id": ent,
                    "type": "player",
                    "x": int(pos.x),
                    "y": int(pos.y),
                    "color": player.color,
                }
            )

        # 2 Components: Use Unpacking (pos, bullet)
        for ent, (pos, _) in esper.get_components(Position, Bullet):
            entities_data.append(
                {
                    "id": ent,
                    "type": "bullet",
                    "x": int(pos.x),
                    "y": int(pos.y),
                    "color": 0xFFFFFF,
                }
            )

        payload = json.dumps({"type": "gamestate", "entities": entities_data})

        # 1 Component: NO Unpacking, just 'player'
        for ent, player in esper.get_components(Player):
            asyncio.create_task(self.safe_send(player.socket, payload))

    async def safe_send(self, socket, message):
        try:
            await socket.send(message)
        except:
            pass


# --- MAIN SERVER LOGIC ---

# ERROR FIX: No world = esper.World() anymore.
# We register processors directly to the module.
esper.add_processor(InputSystem())
esper.add_processor(MovementSystem())
esper.add_processor(BoundarySystem())

connected_clients = {}


async def game_loop():
    # Pass the event loop to the broadcaster
    esper.add_processor(StateBroadcastSystem(asyncio.get_running_loop()))
    while True:
        esper.process()  # <--- Calls process() on all added Processors
        await asyncio.sleep(dt)


async def handler(websocket):
    print("New Client Connected")

    # ERROR FIX: Use esper.create_entity
    player_id = esper.create_entity(
        Position(WIDTH / 2, HEIGHT / 2),
        Velocity(0, 0),
        Player(socket=websocket, color=random.randint(0, 0xFFFFFF), inputs={}),
        Collider(radius=15),
    )

    connected_clients[websocket] = player_id

    try:
        async for message in websocket:
            data = json.loads(message)
            if data["type"] == "input":
                # ERROR FIX: Use esper.try_component
                player = esper.try_component(player_id, Player)
                if player:
                    player.inputs = data["state"]
    except Exception as e:
        print(f"Client Disconnected: {e}")
    finally:
        # ERROR FIX: Check existence before deleting
        if esper.entity_exists(player_id):
            esper.delete_entity(player_id)
        if websocket in connected_clients:
            del connected_clients[websocket]


async def main():
    print(f"Server started on port 8765")
    asyncio.create_task(game_loop())
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

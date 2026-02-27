import numpy as np

class ECSWorld:
    def __init__(self, capacity=1000):
        self.capacity = capacity
        self.num_entities = 0
        
        # Component Storage: Each component is a separate NumPy array
        # We use a dictionary to store them by name
        self.components = {}
        
        # Mask: Keeps track of which entity has which component
        # We use a bitmask (uint64) where each bit represents a component type
        self.masks = np.zeros(capacity, dtype=np.uint64)
        self.comp_to_bit = {}
        self.next_bit = 0

    def register_component(self, name, dtype, shape=(1,)):
        """Registers a new component type with a specific NumPy dtype."""
        self.components[name] = np.zeros((self.capacity, *shape), dtype=dtype)
        self.comp_to_bit[name] = 1 << self.next_bit
        self.next_bit += 1

    def create_entity(self):
        """Returns the ID of a new entity."""
        if self.num_entities >= self.capacity:
            raise MemoryError("ECS Capacity reached.")
        entity_id = self.num_entities
        self.num_entities += 1
        return entity_id

    def add_component(self, entity_id, name, value):
        """Adds component data to an entity and updates its mask."""
        self.components[name][entity_id] = value
        self.masks[entity_id] |= self.comp_to_bit[name]

    def get_entities_with(self, *component_names):
        """
        Returns a boolean mask of all entities that possess 
        ALL the specified components.
        """
        target_mask = 0
        for name in component_names:
            target_mask |= self.comp_to_bit[name]
        
        # NumPy vectorized bitwise check
        return (self.masks & target_mask) == target_mask
      
      
# --- Setup ---
world = ECSWorld(capacity=10000)

# Register components
# Position: (x, y) - float32
world.register_component('position', np.float32, shape=(2,))
# Velocity: (vx, vy) - float32
world.register_component('velocity', np.float32, shape=(2,))

# --- Populate Entities ---
for _ in range(5000):
    e = world.create_entity()
    world.add_component(e, 'position', [0.0, 0.0])
    world.add_component(e, 'velocity', np.random.randn(2))

# --- Define a System ---
def movement_system(world, dt):
    # 1. Find entities that have BOTH position and velocity
    active_mask = world.get_entities_with('position', 'velocity')
    
    # 2. Vectorized update: pos = pos + vel * dt
    # This happens at C-speed via NumPy
    pos = world.components['position']
    vel = world.components['velocity']
    
    pos[active_mask] += vel[active_mask] * dt

# --- Main Loop ---
import time

for frame in range(100):
    start = time.perf_counter()
    movement_system(world, 0.016)
    end = time.perf_counter()
    
    if frame % 20 == 0:
        print(f"Frame {frame} took {(end-start)*1000:.4f}ms")
        print(f"Sample Position of Entity 0: {world.components['position'][0]}")
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint
from scipy.linalg import solve_continuous_are

# 1. Define System Dynamics (Mass-Spring-Damper)
# x = [position, velocity]
A = np.array([[0, 1], 
              [-1, -0.5]]) 
B = np.array([[0], 
              [1]])

# 2. Define Weights (The "Strategy")
# Try changing Q[0,0] to 100 to prioritize position accuracy
# Try changing R to 10 to save energy
Q = np.array([[500, 0], 
              [0, 1]])  
R = np.array([[1]])      

def solve_hjb_and_simulate(A, B, Q, R, x0, t):
    # Solve the Riccati Equation (HJB Analytical Solution)
    P = solve_continuous_are(A, B, Q, R)
    
    # Calculate Optimal Gain K
    K = np.linalg.inv(R) @ B.T @ P
    
    print(np.linalg.inv(R) , B.T , P)
    print(K) # debug
    
    # Define closed-loop system: dx/dt = (A - BK)x
    def system_dynamics(x, t):
        return (A - B @ K) @ x

    # Simulate states
    states = odeint(system_dynamics, x0, t)
    
    # Calculate Cost: integral of (x'Qx + u'Ru)
    total_cost = 0
    dt = t[1] - t[0]
    for x_val in states:
        u_val = -K @ x_val
        # Ensure we are summing scalars
        cost_step = (x_val.T @ Q @ x_val + u_val.T @ R @ u_val) * dt
        total_cost += cost_step
        
    return states, total_cost

# Simulation settings
t = np.linspace(0, 20, 1000)
x0 = np.array([2, 0]) 

# Run
states, cost = solve_hjb_and_simulate(A, B, Q, R, x0, t)

# Plotting
plt.figure(figsize=(10, 5))
plt.plot(t, states[:, 0], label='Position (x1)', linewidth=2)
plt.plot(t, states[:, 1], label='Velocity (x2)', linestyle='--')

# FIXED LINE HERE:
plt.title(f"Optimal Control via HJB (LQR)\nTotal Cost: {float(cost):.2f}")

plt.xlabel("Time")
plt.ylabel("State Value")
plt.legend()
plt.grid(True)
plt.show()
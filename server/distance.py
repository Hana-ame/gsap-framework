import numpy as np
import matplotlib.pyplot as plt
import math

# Define the functions
def f1(x):
    """Square root function: sqrt(1 + x^2)"""
    return np.sqrt(1 + x**2)

def f2(x):
    """Linear function: 15/16 + 1/2*x"""
    return 15/16 + 0.5 * x

# Create a range of x values
x = np.linspace(0, 1, 1000)

# Calculate function values
y1 = f1(x)  # sqrt(1 + x^2)
y2 = f2(x)  # 15/16 + 1/2*x

difference = np.abs(y1 - y2)
theta = (y1-y2)**2

print(np.average(difference))
print(np.average(theta))
print(np.max(difference))
print(np.max(theta))




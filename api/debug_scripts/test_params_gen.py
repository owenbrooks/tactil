# file to generate some test input for generate_stl.py
import numpy as np
import math
from generate_stl import generate

box_properties = {}
box_properties["box_centers"] = np.array([[3.5, 2, 0]])
box_properties["box_extents"] = np.array([[math.sqrt(5), 0.1, 0.1]])

rot_angle = math.pi / 3  # 60 deg
cos_theta = math.cos(rot_angle)
sin_theta = math.sin(rot_angle)
box_properties["box_rotations"] = np.array(
    [[[cos_theta, -sin_theta, 0], [sin_theta, cos_theta, 0], [0, 0, 1]]]
) 

generate(box_properties, visualise=True)

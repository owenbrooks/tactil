from api.VectorMap import VectorMap
from api.generate_stl import BoxProperties, vector_map_to_box_properties
import numpy as np

def vecmap_boxes_conversion() -> None:
    box_centers = [np.array([0.5, 0.5, 0])]
    box_extents = [np.array([np.sqrt(2), 0.1, 0])]
    box_rotations = [np.array([[1/np.sqrt(2), -1/np.sqrt(2), 0], [1/np.sqrt(2), 1/np.sqrt(2), 0], [0,0,1]])]

    box_properties = BoxProperties(box_centers, box_extents, box_rotations)
    print(box_properties)

    vecmap = VectorMap.from_boxes(box_centers, box_extents, box_rotations)
    print(vecmap)

    box_props2 = vector_map_to_box_properties(vecmap)
    print(box_props2)



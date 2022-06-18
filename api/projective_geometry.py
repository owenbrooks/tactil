import numpy as np
from typing import Tuple
from dataclasses import dataclass

@dataclass
class Dimension:
    """Class for storing 2D dimensions."""
    width: float
    height: float

def normalise_homogeneous_coords(coords: np.array) -> np.array:
    """:param coords: Nx1 vector of homogeneous coordinates 
    :return: normalised equivalent of the coordinate"""
    if coords[-1] == 0:
        return coords.copy()
    else:
        normalised = coords / coords[-1]
        return normalised


def image_to_camera_frame(K: np.array, p: np.array):
    """:param K: 3x3 camera intrinsic matrix
    :param p: 3x1 homogenous image coordinate, where final coordinate is depth from camera frame"""
    # assumes no skew (s = 0)
    f_v = K[0, 0]
    u_0 = K[0, 2]
    f_u = K[1, 1]
    v_0 = K[1, 2]
    u = p[0]
    v = p[1]
    z = p[2]
    x = (u - u_0) * z / f_u
    y = (v - v_0) * z / f_v

    return np.array([x, y, z])


def image_width_from_params(camera_params) -> Dimension:
    """Computes real-world width and height
    :param camera_params: open3d view_control.convert_to_pinhole_camera_parameters()
    :return: (width, height) """
    # get camera parameters
    camera_z_coord = camera_params.extrinsic[2][3]  # assumed distance to world xy plane
    camera_width, camera_height = (
        camera_params.intrinsic.width,
        camera_params.intrinsic.height,
    )
    print(camera_width, camera_height)
    intr = camera_params.intrinsic.intrinsic_matrix
    extr = camera_params.extrinsic
    print(f"intr: \n{intr}\nextr: \n{extr}")
    inv_intr = np.linalg.inv(intr)
    inv_extr = np.linalg.inv(extr)
    print(f"inv_intr: \n{inv_intr}\ninv_extr: \n{inv_extr}")

    # define points at the image boundary
    top_left_cam = np.array([-camera_width / 2, -camera_height / 2, camera_z_coord])
    top_right_cam = np.array([camera_width / 2, -camera_height / 2, camera_z_coord])
    bottom_left_cam = np.array([-camera_width / 2, camera_height / 2, camera_z_coord])

    # transform from image to camera coordinates
    top_left_world = image_to_camera_frame(intr, top_left_cam)
    top_right_world = image_to_camera_frame(intr, top_right_cam)
    bottom_left_world = image_to_camera_frame(intr, bottom_left_cam)

    # compute real-world image dimensions
    width = distance(top_left_world, top_right_world)
    height = distance(top_left_world, bottom_left_world)

    return Dimension(width, height)


def distance(point_a: np.array, point_b: np.array):
    return np.sqrt(np.sum((point_a - point_b) ** 2))


if __name__ == "__main__":
    a = np.array([0, 0, 1])
    b = np.array([1, 1, 1])
    print(distance(a, b))

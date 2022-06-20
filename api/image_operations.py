import numpy as np
from dataclasses import dataclass
import open3d as o3d
import os
import typing
import uuid

@dataclass
class Dimensions:
    """Class for storing 2D dimensions."""
    width: float
    height: float

@dataclass
class Coordinate:
    x: float
    y: float

@dataclass
class ImageInfo:
    """Class for storing location, size and origin of image."""
    path: str
    world_dimensions: Dimensions
    origin_camera: Coordinate

# Save image to be viewed in the editor
def save_image(
    pcd, image_dir: typing.Union[str, bytes, os.PathLike]
) -> ImageInfo:
    # create output directory if it doesn't exist
    if not os.path.exists(image_dir):
        os.mkdir(image_dir)

    image_filename = str(uuid.uuid4()) + ".png"
    image_path = os.path.join(image_dir, image_filename)
    vis = o3d.visualization.Visualizer()
    vis.create_window(visible=False)
    vis.add_geometry(pcd)
    vis.update_geometry(pcd)
    view_control = vis.get_view_control()

    # compute real-world image width
    camera_params = view_control.convert_to_pinhole_camera_parameters()
    image_dimensions = image_width_from_params(camera_params)
    print(image_dimensions.width, image_dimensions.height)

    # decrease field of view to make wall boundaries more clear
    desired_field_of_view = 1.0
    current_field_of_view = view_control.get_field_of_view()
    view_control.change_field_of_view(desired_field_of_view-current_field_of_view)

    render_option = vis.get_render_option()
    render_option.point_size = 3
    vis.poll_events()
    vis.update_renderer()
    vis.capture_screen_image(image_path)
    vis.destroy_window()

    origin_camera = find_origin_camera(camera_params)
    print(origin_camera)

    return ImageInfo(image_path, image_dimensions, origin_camera)


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


def find_origin_camera(camera_params) -> Coordinate:
    """ Computes the xy location of the world origin in the camera frame (camera frame at center of image) """
    extr = camera_params.extrinsic
    origin_world = np.array([0, 0, 0, 1]) # homogenous coordinate
    origin_camera = extr @ origin_world

    origin_camera = Coordinate(origin_camera[0], origin_camera[1])

    return origin_camera


def image_width_from_params(camera_params) -> Dimensions:
    """Computes real-world width and height
    :param camera_params: open3d view_control.convert_to_pinhole_camera_parameters()
    :return: (width, height) """
    # get camera parameters
    camera_z_coord = camera_params.extrinsic[2][3]  # assumed distance to world xy plane
    camera_width, camera_height = (
        camera_params.intrinsic.width,
        camera_params.intrinsic.height,
    )
    intr = camera_params.intrinsic.intrinsic_matrix
    extr = camera_params.extrinsic
    # print(f"intr: \n{intr}\nextr: \n{extr}")

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

    return Dimensions(width, height)


def distance(point_a: np.array, point_b: np.array):
    return np.sqrt(np.sum((point_a - point_b) ** 2))


if __name__ == "__main__":
    a = np.array([0, 0, 1])
    b = np.array([1, 1, 1])
    print(distance(a, b))

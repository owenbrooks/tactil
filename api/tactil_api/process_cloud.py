import numpy as np
import open3d as o3d
import sys
import time
from sklearn.cluster import MeanShift, estimate_bandwidth
import matplotlib.pyplot as plt
import typing
import os
from .VectorMap import VectorMap
from .typings.o3d_geometry import PointCloud
from .pcd_operations import (
    dbscan_cluster,
    remove_small_clusters,
    get_bounding_boxes,
    segment_planes,
    separate_pcd_by_labels,
    vertical_threshold,
)
from .image_operations import ImageInfo, save_image
from scipy import stats
from scipy.spatial.transform import Rotation as R
import math
from typing import Tuple
from .SuppressStream import SuppressStream


def process(
    pcd_path: typing.Union[str, bytes, os.PathLike],
    image_dir: typing.Union[str, bytes, os.PathLike],
    z_index: int = 2,
    visualise=False,
) -> Tuple[VectorMap, ImageInfo]:
    # o3d.utility.set_verbosity_level(o3d.utility.VerbosityLevel.Error)
    pcd = read_cloud(pcd_path, z_index)
    if visualise:
        print("Pre-vertical threshold.")
        o3d.visualization.draw_geometries([pcd])
    pcd = vertical_threshold(pcd, threshold_height=0.5)  # Remove roof
    downsampled_for_display = create_display_pcd(pcd, visualise)
    pcd = remove_nonwall_points(pcd, visualise)
    unit_normals, labels = cluster_by_normal(pcd)
    rotation_matrix = find_rot_to_primary_normal(unit_normals, labels)
    pcd.rotate(rotation_matrix, center=(0, 0, 0))
    print("Rotated to primary normal direction")
    large_normal_clusters = partition_by_normal_and_density(pcd, labels, visualise)
    centers, extents, rotations = fit_models(large_normal_clusters, visualise)
    # convert to VectorMap representation
    vector_map = VectorMap.from_boxes(centers, extents, rotations)

    # Take picture of rotated pcd for editor
    downsampled_for_display.rotate(rotation_matrix, center=(0, 0, 0))
    try:
        image_info = save_image(downsampled_for_display, image_dir)
    except RuntimeError as e:
        print(e)
        image_info = None

    print("Initial processing complete.")
    return vector_map, image_info


def read_cloud(
    pcd_path: typing.Union[str, bytes, os.PathLike], z_index: int = 2
) -> PointCloud:
    # Load pcd
    load_tic = time.perf_counter()
    print("Loading pcd")
    pcd = o3d.io.read_point_cloud(pcd_path)
    load_toc = time.perf_counter()
    print(f"Loaded pcd {pcd_path} in {load_toc-load_tic: 0.4f} seconds")

    # Switch vertical axis if specified
    if z_index != 2:
        pcd_points = np.asarray(pcd.points)
        pcd_normals = np.asarray(pcd.normals)
        pcd_points[:, [2, z_index]] = pcd_points[:, [z_index, 2]]
        pcd_normals[:, [2, z_index]] = pcd_normals[:, [z_index, 2]]
        pcd.points = o3d.cpu.pybind.utility.Vector3dVector(pcd_points)
        pcd.normals = o3d.cpu.pybind.utility.Vector3dVector(pcd_normals)

    return pcd


def create_display_pcd(pcd: PointCloud, visualise: bool) -> PointCloud:
    if visualise:
        print("Pre-downsampling")
        o3d.visualization.draw_geometries([pcd])

    # Display downsampled pcd with roof removed
    downsampled_for_display = pcd.voxel_down_sample(voxel_size=0.1)
    # Create coordinate frame for visualisation
    origin_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(
        size=0.6, origin=[0, 0, 0]
    )
    if visualise:
        print("Post-downsampling")
        o3d.visualization.draw_geometries([downsampled_for_display, origin_frame])

    return downsampled_for_display


def remove_nonwall_points(pcd: PointCloud, visualise: bool) -> PointCloud:
    # Downsample pcd
    pcd = pcd.voxel_down_sample(voxel_size=0.1)
    print(f"Downsampled pcd. New length: {np.asarray(pcd.points).shape[0]}")

    # Filter out for only points that have close to horizontal normals
    normals = np.asarray(pcd.normals)
    vertical = np.array([0.0, 0.0, 0.0])
    vertical[2] = 1.0
    dot = np.array([np.dot(vertical, norm) for norm in normals])
    horz_norms = np.arange(len(dot))[np.abs(dot) < 0.2]
    pcd = pcd.select_by_index(horz_norms)
    print(
        f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}"
    )
    if visualise:
        o3d.visualization.draw_geometries([pcd])

    # Perform dbscan clustering and remove small clusters
    min_cluster_size = 20  # points
    rem_small_tic = time.perf_counter()
    labels, _ = dbscan_cluster(pcd, epsilon=0.5, min_points=20)
    rem_small_toc = time.perf_counter()
    print(f"Performed clustering in {rem_small_toc-rem_small_tic: 0.4f} seconds")
    if visualise:
        o3d.visualization.draw_geometries([pcd])
    pcd = remove_small_clusters(pcd, labels, min_point_count=min_cluster_size)
    print(f"Removed clusters smaller than {min_cluster_size} points")
    if visualise:
        o3d.visualization.draw_geometries([pcd])

    return pcd


def cluster_by_normal(pcd: PointCloud) -> Tuple[np.ndarray, np.ndarray]:
    # Compute unit normal vectors
    normals = np.asarray(pcd.normals)
    step = 1
    normals = normals[::step, :]
    magnitudes = np.linalg.norm(normals, axis=1)
    magnitudes[magnitudes == 0] = 1e-6  # set 0 magnitude to very small value
    unit_normals = normals / magnitudes.reshape(-1, 1)

    # Compute clustering with MeanShift after estimating bandwidth
    bw_tic = time.perf_counter()
    bandwidth = estimate_bandwidth(unit_normals, quantile=0.05)
    bw_toc = time.perf_counter()
    print(f"Estimated bandwidth as {bandwidth} in {bw_toc-bw_tic: 0.4f} seconds")
    ms_tic = time.perf_counter()
    ms = MeanShift(bandwidth=bandwidth, bin_seeding=True)
    ms.fit(unit_normals)
    ms_toc = time.perf_counter()
    labels = ms.labels_
    print(
        f"Meanshift normal clustering: found clusters in {ms_toc-ms_tic: 0.4f} seconds"
    )

    return unit_normals, labels


def find_rot_to_primary_normal(unit_normals: np.ndarray, labels: np.ndarray):
    # Rotate pcd to align with primary direction
    most_common_label = stats.mode(labels).mode
    biggest_normal_cluster = unit_normals[labels == most_common_label]
    primary_normal_direction = np.mean(biggest_normal_cluster, axis=0)
    z_angle = (
        math.atan2(primary_normal_direction[1], primary_normal_direction[0]) - np.pi / 2
    )
    rotation_matrix = R.from_euler("xyz", [0, 0, -z_angle]).as_matrix()

    return rotation_matrix


def partition_by_normal_and_density(pcd: PointCloud, labels, visualise: bool) -> list[PointCloud]:
    """Divides the pcd into a list of sub-clouds according to the normal direction clustering,
    and by then using dbscan"""
    # Separate pcd based on normal direction
    normal_clusters = []
    labels_unique = np.unique(labels)
    for i in range(len(labels_unique)):
        current_cluster_mask = labels == i
        point_count = len(np.asarray(pcd.points))
        current_cluster_indices = np.arange(point_count)[current_cluster_mask]
        cluster = pcd.select_by_index(current_cluster_indices)
        normal_clusters.append(cluster)

    if visualise:
        o3d.visualization.draw_geometries(normal_clusters)

    # Separate pcds further using dbscan clustering
    large_normal_clusters = []
    print("Cluster count: [", end='')
    for norm_clust in normal_clusters:
        labels, cluster_count = dbscan_cluster(norm_clust, epsilon=0.2, min_points=10)
        print(f"{cluster_count}, ", end='')
        separated_clusters = separate_pcd_by_labels(norm_clust, labels)
        # remove last label which are "noise" points
        large_normal_clusters += separated_clusters[:-1]
    print("]")

    # Paint point cloud according to cluster
    def paint_pcd_list(pcd_list):
        for i in range(len(pcd_list)):
            colour = plt.get_cmap("tab20")(i)
            pcd_list[i].paint_uniform_color(list(colour[:3]))

    paint_pcd_list(normal_clusters)
    if visualise:
        o3d.visualization.draw_geometries(large_normal_clusters)

    return large_normal_clusters


def fit_models(
    large_normal_clusters: list[PointCloud], visualise: bool
) -> Tuple[list[np.ndarray], list[np.ndarray], list[np.ndarray]]:
    # segment planes
    planes = []
    plane_models = []
    remaining_points = []
    with SuppressStream(sys.stderr):
        for norm_clust in large_normal_clusters:
            segments, segment_models, rest = segment_planes(
                norm_clust,
                distance_threshold=0.05,
                num_iterations=1000,
                verticality_epsilon=0.5,
                min_plane_size=100,
                z_index=2,
            )

            planes += segments
            plane_models += segment_models
            remaining_points.append(rest)

        line_sets, _ = get_bounding_boxes(planes)

        # o3d.visualization.draw_geometries(line_sets + planes)
        # o3d.visualization.draw_geometries(normal_clusters + line_sets + planes + remaining_points)

        # Flatten into 2D
        def flatten(pcd):
            points = np.asarray(pcd.points)
            points[:, 2] = 0.0  # flatten in z direction
            pcd.points = o3d.utility.Vector3dVector(points)

        for cloud in planes:
            flatten(cloud)

        line_sets, boxes = get_bounding_boxes(planes)

    # Create coordinate frame for visualisation
    origin_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(
        size=0.6, origin=[0, 0, 0]
    )
    if visualise:
        o3d.visualization.draw_geometries(planes + line_sets + [origin_frame])

    # Display frame markers for each box
    frame_markers = []
    for box in boxes:
        center = box.get_center()
        rotation = box.R

        mesh = (
            o3d.geometry.TriangleMesh.create_coordinate_frame()
            .rotate(rotation)
            .translate(center)
        )
        frame_markers.append(mesh)

    if visualise:
        o3d.visualization.draw_geometries(
            planes + line_sets + [origin_frame] + frame_markers
        )

    centers = [box.get_center().tolist() for box in boxes]
    extents = [box.extent.tolist() for box in boxes]
    rotations = [box.R.tolist() for box in boxes]

    return centers, extents, rotations

def main():
    visualise = False
    if len(sys.argv) > 2:
        visualise = sys.argv[2] == "visualise"

    # create output directories
    output_dir = "output"
    image_dir = os.path.join(output_dir, "images")
    if not os.path.exists(image_dir):
        os.makedirs(image_dir, exist_ok=True)

    # process point cloud
    outputs, image_info = process(sys.argv[1], image_dir, visualise=visualise)

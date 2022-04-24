import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go
import time
from sklearn.cluster import MeanShift, estimate_bandwidth
import matplotlib.pyplot as plt
import typing
import os
from pcd_operations import dbscan_cluster, remove_small_clusters, get_bounding_boxes, segment_planes, separate_pcd_by_labels, vertical_threshold

def process(pcd_path: typing.Union[str, bytes, os.PathLike], visualise: bool):
    # o3d.utility.set_verbosity_level(o3d.utility.VerbosityLevel.Error)
    # Load pcd
    load_tic = time.perf_counter()
    print("Loading pcd")
    pcd = o3d.io.read_point_cloud(pcd_path)
    load_toc = time.perf_counter()
    print(f"Loaded pcd {pcd_path} in {load_toc-load_tic: 0.4f} seconds")

    # Create coordinate frame for visualisation
    origin_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=0.6, origin=[0, 0, 0])

    # Remove roof
    max_height = 2.2
    pcd = vertical_threshold(pcd, threshold_height=max_height)

    # Display downsampled pcd with roof removed
    downsampled_for_display = pcd.voxel_down_sample(voxel_size=0.05)

    if visualise:
        o3d.visualization.draw_geometries([downsampled_for_display])

    # Downsample pcd
    pcd = pcd.voxel_down_sample(voxel_size=0.1)
    print("Downsampled pcd")

    # Filter out for only points that have close to horizontal normals
    normals = np.asarray(pcd.normals)
    vertical = np.array([0.0, 0.0, 0.0])
    z_index = 2
    vertical[z_index] = 1.0
    dot = np.array([np.dot(vertical, norm) for norm in normals])
    horz_norms = np.arange(len(dot))[np.abs(dot)<0.2]
    pcd = pcd.select_by_index(horz_norms)
    print(f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}")
    if visualise:
        o3d.visualization.draw_geometries([pcd])

    # Perform dbscan clustering and remove small clusters
    min_cluster_size = 20 # points
    rem_small_tic = time.perf_counter()
    labels = dbscan_cluster(pcd, epsilon=0.2, min_points=10)
    pcd = remove_small_clusters(pcd, labels, min_point_count=min_cluster_size)
    rem_small_toc = time.perf_counter()
    print(f"Removed clusters smaller than {min_cluster_size} points in {rem_small_toc-rem_small_tic: 0.4f} seconds")
    if visualise:
        o3d.visualization.draw_geometries([pcd])

    # Compute unit normal vectors
    normals = np.asarray(pcd.normals)
    step = 1
    normals = normals[::step, :]
    magnitudes = np.linalg.norm(normals, axis=1)
    magnitudes[magnitudes==0] = 1e-6 # set 0 magnitude to very small value
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
    labels_unique = np.unique(labels)
    print(f"Meanshift normal clustering: found {len(labels_unique)} clusters in {ms_toc-ms_tic: 0.4f} seconds")


    # Plot 3D gaussian map
    # nx = unit_normals[:, 0]
    # ny = unit_normals[:, 1]
    # nz = unit_normals[:, 2]
    # fig = go.Figure(data=[
    #         go.Scatter3d(x=nx[::10], y=ny[::10], z=nz[::10], mode='markers', 
    #             marker=dict(
    #                 color=labels[::10],
    #                 size=2,
    #             ),
    #         ), 
    # ])
    # fig.show()

    # Separate pcd based on normal direction
    normal_clusters = []
    for i in range(len(labels_unique)):
        current_cluster_mask = labels == i
        current_cluster_indices = np.arange(len(np.asarray(pcd.points)))[current_cluster_mask]
        cluster = pcd.select_by_index(current_cluster_indices)
        normal_clusters.append(cluster)


    # Paint point cloud according to cluster
    def paint_pcd_list(pcd_list):
        for i in range(len(pcd_list)):
            colour = plt.get_cmap("tab20")(i)
            pcd_list[i].paint_uniform_color(list(colour[:3]))
    
    if visualise:
        o3d.visualization.draw_geometries(normal_clusters)


    # Separate pcds further using dbscan clustering
    large_normal_clusters = []
    for norm_clust in normal_clusters:
        labels = dbscan_cluster(norm_clust, epsilon=0.2, min_points=10)
        separated_clusters = separate_pcd_by_labels(norm_clust, labels) 
        large_normal_clusters += separated_clusters[:-1] # removes last label which are "noise" points

    paint_pcd_list(normal_clusters)
    if visualise:
        o3d.visualization.draw_geometries(large_normal_clusters)

    # segment planes
    planes = [] 
    plane_models = []
    remaining_points = []
    for norm_clust in large_normal_clusters:
        segments, segment_models, rest = segment_planes(norm_clust, distance_threshold=0.05, num_iterations=1000, verticality_epsilon=0.5, min_plane_size=100, z_index=2)

        # generate bounding boxes
        # line_sets = get_bounding_boxes(segments, segment_models)
        # o3d.visualization.draw_geometries(segments + line_sets + [rest])

        planes += segments
        plane_models += segment_models
        remaining_points.append(rest)

    line_sets, _ = get_bounding_boxes(planes)
    # o3d.visualization.draw_geometries(line_sets + planes)
    # o3d.visualization.draw_geometries(normal_clusters + line_sets + planes + remaining_points)

    # Flatten into 2D and downsample again
    def flatten(pcd):
        points = np.asarray(pcd.points)
        points[:, z_index] = 0.0 # flatten
        pcd.points = o3d.utility.Vector3dVector(points)

    for cloud in planes:
        flatten(cloud)

    # pcd = pcd.voxel_down_sample(voxel_size=0.05)
    line_sets, boxes = get_bounding_boxes(planes)
    if visualise:
        o3d.visualization.draw_geometries(planes + line_sets + [origin_frame])
        o3d.visualization.draw_geometries([planes[0], line_sets[0], origin_frame])
    # o3d.visualization.draw_geometries(line_sets)

    # display frame markers for each box
    frame_markers = []
    for box in boxes:
        center = box.get_center()
        rotation = box.R

        mesh = o3d.geometry.TriangleMesh.create_coordinate_frame().rotate(rotation).translate(center)
        frame_markers.append(mesh)

    if visualise:
        o3d.visualization.draw_geometries(planes + line_sets + [origin_frame] + frame_markers)

    centers = [box.get_center().tolist() for box in boxes]
    extents = [box.extent.tolist() for box in boxes]
    rotations = [box.R.tolist() for box in boxes]

    outputs = {
        'box_centers': centers,
        'box_extents': extents,
        'box_rotations': rotations,
    }

    print("Initial processing complete.")
    return outputs 


if __name__ == "__main__":
    outputs = process(sys.argv[1], visualise=False)

    # save outputs to files
    output_dir = 'output'
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)

    with open('output/centres.npy', 'wb') as f:
        np.save(f, np.array(outputs['box_centers']))
    with open('output/extents.npy', 'wb') as f:
        np.save(f, np.array(outputs['box_extents']))
    with open('output/rotations.npy', 'wb') as f:
        np.save(f, np.array(outputs['box_rotations']))
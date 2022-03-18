import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go
from sklearn.cluster import MeanShift, estimate_bandwidth
import matplotlib.pyplot as plt
from multiplane import dbscan_cluster, remove_small_clusters, get_bounding_boxes, segment_planes, separate_pcd

def main():
    # Load pcd
    print("Loading pcd")
    filename = sys.argv[1]
    pcd = o3d.io.read_point_cloud(filename)
    print("Loaded pcd")

    # Downsample pcd
    pcd = pcd.voxel_down_sample(voxel_size=0.1)
    print("Downsampled pcd")


    # Filter out for only points that have close to horizontal normals
    normals = np.asarray(pcd.normals)
    vertical = np.array([0.0, 1.0, 0.0])
    dot = np.array([np.dot(vertical, norm) for norm in normals])
    horz_norms = np.arange(len(dot))[np.abs(dot)<0.2]
    pcd = pcd.select_by_index(horz_norms)
    print(f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}")

    labels = dbscan_cluster(pcd, epsilon=0.2, min_points=10)

    min_cluster_size = 20 # points
    pcd = remove_small_clusters(pcd, labels, min_point_count=min_cluster_size)
    print(f"Removed clusters smaller than {min_cluster_size} points.")
    # o3d.visualization.draw_geometries([pcd])


    # Compute unit normal vectors
    normals = np.asarray(pcd.normals)
    step = 1
    normals = normals[::step, :]
    magnitudes = np.linalg.norm(normals, axis=1)
    magnitudes[magnitudes==0] = 1e-6 # set 0 magnitude to very small value
    unit_normals = normals / magnitudes.reshape(-1, 1)
    nx = unit_normals[:, 0]
    ny = unit_normals[:, 1]
    nz = unit_normals[:, 2]


    # Compute clustering with MeanShift after estimating bandwidth
    bandwidth = estimate_bandwidth(unit_normals, quantile=0.05)
    ms = MeanShift(bandwidth=bandwidth, bin_seeding=True)
    ms.fit(unit_normals)
    labels = ms.labels_
    cluster_centers = ms.cluster_centers_
    labels_unique = np.unique(labels)
    n_clusters_ = len(labels_unique)
    print("Number of estimated clusters : %d" % n_clusters_)


    # Plot 3D gaussian map
    # fig = go.Figure(data=[
    #         go.Scatter3d(x=nx[::10], y=ny[::10], z=nz[::10], mode='markers', 
    #             marker=dict(
    #                 color=labels[::10],
    #                 size=2,
    #             ),
    #         ), 
    # ])
    # fig.show()


    # Paint point cloud according to cluster
    normal_clusters = []
    for i in range(len(labels_unique)):
        colours = plt.get_cmap("tab20")(i)
        current_cluster_mask = labels == i
        current_cluster_indices = np.arange(len(np.asarray(pcd.points)))[current_cluster_mask]
        cluster = pcd.select_by_index(current_cluster_indices)
        cluster.paint_uniform_color(list(colours[:3]))
        normal_clusters.append(cluster)

    # o3d.visualization.draw_geometries(normal_clusters)

    # Remove small dbscan clusters for each normal group
    large_normal_clusters = []
    for norm_clust in normal_clusters:
        labels = dbscan_cluster(norm_clust, epsilon=0.2, min_points=10)
        separated_clusters = separate_pcd(norm_clust, labels)
        large_normal_clusters += separated_clusters

    o3d.visualization.draw_geometries(large_normal_clusters)

    # segment planes
    planes = [] 
    plane_models = []
    remaining_points = []
    for norm_clust in large_normal_clusters:
        segments, segment_models, rest = segment_planes(norm_clust, distance_threshold=0.05, num_iterations=1000, verticality_epsilon=0.5, min_plane_size=100)

        # generate bounding boxes
        line_sets = get_bounding_boxes(segments, segment_models)
        # o3d.visualization.draw_geometries(segments + line_sets + [rest])

        planes += segments
        plane_models += segment_models
        remaining_points.append(rest)

    line_sets = get_bounding_boxes(planes, plane_models)
    o3d.visualization.draw_geometries(line_sets)
    o3d.visualization.draw_geometries(line_sets + planes)
    # o3d.visualization.draw_geometries(normal_clusters + line_sets + planes + remaining_points)

if __name__ == "__main__":
    main()
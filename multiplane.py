import numpy as np
import open3d as o3d
import sys
import matplotlib.pyplot as plt


# Max vertical threhold
def vertical_threshold(pcd, threshold_height):
    points = np.asarray(pcd.points)
    remaining = points[:, 1] < threshold_height
    pcd = pcd.select_by_index(np.arange(len(remaining))[remaining])
    print(np.asarray(pcd.points).shape)
    return pcd


# Filter out for only points that have close to horizontal normals
def horizontal_normal_filter(pcd, epsilon):
    normals = np.asarray(pcd.normals)
    vertical = np.array([0.0, 1.0, 0.0])
    dot = np.array([np.dot(vertical, norm) for norm in normals])
    horz_norms = np.arange(len(dot))[np.abs(dot)<epsilon]
    pcd = pcd.select_by_index(horz_norms)
    return pcd


# Cluster using dbscan
def dbscan_cluster(pcd, epsilon, min_points):
    with o3d.utility.VerbosityContextManager(
            o3d.utility.VerbosityLevel.Debug) as cm:
        labels = np.array(pcd.cluster_dbscan(eps=epsilon, min_points=min_points, print_progress=True))
        # for an nx3 pcd, labels is nx1 integers, with -1 representing noise points, 
        # and positive ints and 0 indicating which cluster a point belongs to
    max_label = labels.max()
    print(f"Point cloud has {max_label + 1} clusters")
    colors = plt.get_cmap("tab20")(labels / (max_label if max_label > 0 else 1))
    colors[labels < 0] = 0
    pcd.colors = o3d.utility.Vector3dVector(colors[:, :3])
    return labels


# Remove small clusters
def remove_small_clusters(pcd, labels, min_point_count):
    noise_label = np.amax(labels)+1
    labels[labels == -1] = noise_label # need all non-negative for bincount
    count = np.bincount(labels)
    large_cluster_labels = np.unique(labels)[count > min_point_count]
    noise_points = np.argwhere(large_cluster_labels == noise_label)
    large_cluster_labels = np.delete(large_cluster_labels, noise_points) # remove noise points which might otherwise form a big cluster
    is_large_cluster = np.in1d(labels, large_cluster_labels)
    larger_cluster_indices = np.arange(np.asarray(pcd.points).shape[0])[is_large_cluster]
    pcd = pcd.select_by_index(larger_cluster_indices)
    return pcd


# Perform plane segmentation and get bounding boxes for vertical planes
def segment_planes(pcd, distance_threshold, num_iterations, verticality_epsilon, min_plane_size):
    segment_models=[]
    segments=[]
    rest = pcd
    max_plane_idx = 15
    rest.paint_uniform_color([0.8, 0.8, 0.8])

    for i in range(max_plane_idx):
        colours = plt.get_cmap("tab20")(i)
        try:
            if len(np.asarray(rest.points)) < min_plane_size:
                break
            plane_model, inliers = rest.segment_plane(distance_threshold=distance_threshold,ransac_n=3,num_iterations=num_iterations)
            # filter for vertical planes (horizontal normals)
            normal = plane_model[0:3]
            vertical = np.array([0.0, 1.0, 0.0])
            is_vertical = np.dot(vertical, normal) < verticality_epsilon
            if is_vertical:
                segment_models.append(plane_model)
                segment = rest.select_by_index(inliers)
                segment.paint_uniform_color(list(colours[:3]))
                segments.append(segment)
                rest = rest.select_by_index(inliers, invert=True)
        except Exception as e:
            print(e)
        
        # print("pass",i+1,"/",max_plane_idx,"done.")

    return segments, segment_models, rest


# Find and draw oriented bounding boxes
def get_bounding_boxes(segments, segment_models):
    line_sets = []
    for i in range(len(segments)):
        extent = segments[i].get_oriented_bounding_box()
        line_set = o3d.geometry.LineSet.create_from_oriented_bounding_box(extent)
        colors = [[1, 0, 0] for i in range(12)]
        line_set.colors = o3d.utility.Vector3dVector(colors)
        line_sets.append(line_set)
    return line_sets


def separate_pcd(pcd, labels):
    clusters = []

    for label in range(np.amax(labels)):
        current_cluster_mask = labels == label
        current_cluster_indices = np.arange(np.asarray(pcd.points).shape[0])[current_cluster_mask]
        cluster = pcd.select_by_index(current_cluster_indices)
        clusters.append(cluster)

    return clusters


def main():
    # Load pcd
    print("Loading pcd")
    filename = sys.argv[1]
    pcd = o3d.io.read_point_cloud(filename)
    print("Loaded pcd")

    voxel_size = 0.05
    pcd = pcd.voxel_down_sample(voxel_size=voxel_size)
    print(f"Downsampled pcd using voxels of size {voxel_size}")
    # o3d.visualization.draw_geometries([pcd], point_show_normal=False)

    max_height = 2.2
    pcd = vertical_threshold(pcd, threshold_height=max_height)
    print(f"Removed points higher than {vertical_threshold}")
    o3d.visualization.draw_geometries([pcd], point_show_normal=False)

    pcd = horizontal_normal_filter(pcd, 0.2)
    print(f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}")
    # o3d.visualization.draw_geometries([pcd], point_show_normal=False)

    labels = dbscan_cluster(pcd, epsilon=0.1, min_points=10)
    # o3d.visualization.draw_geometries([pcd])

    min_cluster_size = 800 # points
    pcd = remove_small_clusters(pcd, labels, min_point_count=min_cluster_size)
    print(f"Removed clusters smaller than {min_cluster_size} points.")
    # o3d.visualization.draw_geometries([pcd])

    segments, segment_models, rest = segment_planes(pcd, distance_threshold=0.05, num_iterations=1000, verticality_epsilon=0.5, min_plane_size=10)

    # Ensure each plane is made up of only the largest contiguous cluster that fit
    for i in range(len(segments)):
        seg_pcd = segments[i]
        with o3d.utility.VerbosityContextManager(
            o3d.utility.VerbosityLevel.Debug) as cm:
            labels = np.array(seg_pcd.cluster_dbscan(eps=0.1, min_points=10, print_progress=False))
            segments[i] = remove_small_clusters(seg_pcd, labels, min_point_count=80)

    print("Removed small clusters from planes")

    line_sets = get_bounding_boxes(segments, segment_models)
    o3d.visualization.draw_geometries(line_sets + segments +[rest])
    # o3d.visualization.draw_geometries(segments+[rest], 
    #     front=[0.01108164692705163, 0.99948318020971616, -0.030175645465445922],
    #     lookat=[ 0.36654839499999969, 1.0939715543333333, 0.30774251988636392 ],
    #     up=[ 0.34805089590732086, -0.032145887433672644, -0.93692433834286371 ],
    #     zoom=0.37999999999999967
    #     )

    # Flatten into 2D and downsample again
    points = np.asarray(pcd.points)
    points[:, 1] = 0.0 # flatten
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd = pcd.voxel_down_sample(voxel_size=0.05)
    # o3d.visualization.draw_geometries([pcd])

if __name__ == "__main__":
    main()

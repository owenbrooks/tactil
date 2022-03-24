import numpy as np
import open3d as o3d
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
def segment_planes(pcd, distance_threshold, num_iterations, verticality_epsilon, min_plane_size, z_index):
    segment_models=[]
    segments=[]
    rest = pcd
    max_plane_idx = 15
    # rest.paint_uniform_color([0.8, 0.8, 0.8])

    for i in range(max_plane_idx):
        colours = plt.get_cmap("tab20")(i)
        try:
            if len(np.asarray(rest.points)) < min_plane_size:
                break
            plane_model, inliers = rest.segment_plane(distance_threshold=distance_threshold,ransac_n=3,num_iterations=num_iterations)
            # filter for vertical planes (horizontal normals)
            normal = plane_model[0:3]
            vertical = np.array([0.0, 0.0, 0.0])
            vertical[z_index] = 1.0
            is_vertical = np.dot(vertical, normal) < verticality_epsilon
            if is_vertical:
                segment_models.append(plane_model)
                segment = rest.select_by_index(inliers)
                # segment.paint_uniform_color(list(colours[:3]))
                segments.append(segment)
                rest = rest.select_by_index(inliers, invert=True)
        except Exception as e:
            print(e)
        
        # print("pass",i+1,"/",max_plane_idx,"done.")

    return segments, segment_models, rest


# Find and draw oriented bounding boxes
def get_bounding_boxes(segments):
    line_sets = []
    boxes = []
    for i in range(len(segments)):
        box = segments[i].get_oriented_bounding_box(robust=True)
        line_set = o3d.geometry.LineSet.create_from_oriented_bounding_box(box)
        colors = [[1, 0, 0] for _ in range(12)]
        line_set.colors = o3d.utility.Vector3dVector(colors)
        line_sets.append(line_set)
        boxes.append(box)
    return line_sets, boxes


def separate_pcd_by_labels(pcd, labels):
    """ pcd: open3d point cloud with N points
        labels: 1xN numpy array of non-negative integers serving as point labels"""
    clusters = []

    for label in range(np.amax(labels)+1):
        current_cluster_mask = labels == label
        current_cluster_indices = np.arange(np.asarray(pcd.points).shape[0])[current_cluster_mask]
        cluster = pcd.select_by_index(current_cluster_indices)
        clusters.append(cluster)

    return clusters

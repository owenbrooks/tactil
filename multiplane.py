import numpy as np
import open3d as o3d
import sys
import matplotlib.pyplot as plt


# Load pcd
print("Loading pcd")
filename = sys.argv[1]
pcd = o3d.io.read_point_cloud(filename)
print("Loaded pcd")


# Downsample pcd
pcd = pcd.voxel_down_sample(voxel_size=0.05)
print("Downsampled pcd")
# o3d.visualization.draw_geometries([downpcd], point_show_normal=False)


# Max vertical threhold
points = np.asarray(pcd.points)
remaining = points[:, 1] < 2.0
pcd = pcd.select_by_index(np.arange(len(remaining))[remaining])
print(np.asarray(pcd.points).shape)

# Filter out for only points that have close to horizontal normals
normals = np.asarray(pcd.normals)
vertical = np.array([0.0, 1.0, 0.0])
dot = np.array([np.dot(vertical, norm) for norm in normals])
horz_norms = np.arange(len(dot))[np.abs(dot)<0.1]
pcd = pcd.select_by_index(horz_norms)
print(f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}")
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)


# Cluster using dbscan
with o3d.utility.VerbosityContextManager(
        o3d.utility.VerbosityLevel.Debug) as cm:
    labels = np.array(
        pcd.cluster_dbscan(eps=0.1, min_points=10, print_progress=True))
max_label = labels.max()
print(f"Point cloud has {max_label + 1} clusters")
colors = plt.get_cmap("tab20")(labels / (max_label if max_label > 0 else 1))
colors[labels < 0] = 0
pcd.colors = o3d.utility.Vector3dVector(colors[:, :3])
o3d.visualization.draw_geometries([pcd])


# Remove small clusters
noise_label = np.amax(labels)+1
labels[labels == -1] = noise_label # need all non-negative for bincount
count = np.bincount(labels)
large_cluster_labels = np.unique(labels)[count > 500]
noise_points = np.argwhere(large_cluster_labels == noise_label)
large_cluster_labels = np.delete(large_cluster_labels, noise_points) # remove noise points which might otherwise form a big cluster
is_large_cluster = np.in1d(labels, large_cluster_labels)
larger_cluster_indices = np.arange(np.asarray(pcd.points).shape[0])[is_large_cluster]
pcd = pcd.select_by_index(larger_cluster_indices)
print("Removed small clusters")
o3d.visualization.draw_geometries([pcd])


# Perform plane segmentation
segment_models={}
segments={}
rest = pcd
max_plane_idx = 10
rest.paint_uniform_color([0.8, 0.8, 0.8])

for i in range(max_plane_idx):
    colours = plt.get_cmap("tab20")(i)
    segment_models[i], inliers = rest.segment_plane(
    distance_threshold=0.07,ransac_n=3,num_iterations=1000)
    segments[i]=rest.select_by_index(inliers)
    segments[i].paint_uniform_color(list(colours[:3]))
    rest = rest.select_by_index(inliers, invert=True)
    print("pass",i+1,"/",max_plane_idx,"done.")
    
o3d.visualization.draw_geometries([segments[i] for i in range(max_plane_idx)]+[rest])

import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go
from sklearn.cluster import MeanShift, estimate_bandwidth
import matplotlib.pyplot as plt

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
fig = go.Figure(data=[
        go.Scatter3d(x=nx[::10], y=ny[::10], z=nz[::10], mode='markers', 
            marker=dict(
                color=labels[::10],
                size=2,
            ),
        ), 
])
fig.show()


# Paint point cloud according to cluster
clusters = []
for i in range(len(labels_unique)):
    colours = plt.get_cmap("tab20")(i)
    current_cluster_mask = labels == i
    current_cluster_indices = np.arange(len(np.asarray(pcd.points)))[current_cluster_mask]
    cluster = pcd.select_by_index(current_cluster_indices)
    cluster.paint_uniform_color(list(colours[:3]))
    clusters.append(cluster)

o3d.visualization.draw_geometries(clusters)
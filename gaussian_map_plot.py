import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go
from sklearn.cluster import MeanShift, estimate_bandwidth
import plotly.express as px

# Load pcd
print("Loading pcd")
filename = sys.argv[1]
pcd = o3d.io.read_point_cloud(filename)
print("Loaded pcd")

# Downsample pcd
pcd = pcd.voxel_down_sample(voxel_size=0.05)
print("Downsampled pcd")


# Compute unit normal vectors
normals = np.asarray(pcd.normals)
normals = normals[::100, :]
magnitudes = np.linalg.norm(normals, axis=1)
magnitudes[magnitudes==0] = 1e-6 # set 0 magnitude to very small value
unit_normals = normals / magnitudes.reshape(-1, 1)
nx = unit_normals[:, 0]
ny = unit_normals[:, 1]
nz = unit_normals[:, 2]

# Plot 3D gaussian map
fig = go.Figure(data=[go.Scatter3d(x=nx, y=ny, z=nz, mode='markers', 
        marker=dict(
            size=2,
            color='#FF6692'
        ))
    ])
# fig.show()


# Map to uv coordinates on unit sphere
u = 0.5 + np.arctan2(nx, nz)
v = 0.5 + np.arcsin(ny) / np.pi
fig = go.Figure(data=[go.Scatter(x=u, y=v, mode='markers')])
# fig.show()

# Compute clustering with MeanShift
X = np.stack([u, v], axis=1)
X = unit_normals
# The following bandwidth can be automatically detected using
bandwidth = estimate_bandwidth(X, quantile=0.1)

ms = MeanShift(bandwidth=bandwidth, bin_seeding=True)
ms.fit(X)
labels = ms.labels_
cluster_centers = ms.cluster_centers_

labels_unique = np.unique(labels)
n_clusters_ = len(labels_unique)

print("number of estimated clusters : %d" % n_clusters_)


# Plot 2D uv scatter plot
print(labels.shape, labels, labels_unique)
fig = go.Figure(data=[go.Scatter(x=u, y=v, mode='markers',
    marker=dict(
        color=labels,
        size=6
    ))])
fig.show()

# Plot 3D gaussian map
fig = go.Figure(data=[
        go.Scatter3d(x=nx, y=ny, z=nz, mode='markers', 
            marker=dict(
                color=labels,
                size=2,
            ),
        ), 
])
fig.show()
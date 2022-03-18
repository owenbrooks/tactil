import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go

# Load pcd
print("Loading pcd")
filename = sys.argv[1]
pcd = o3d.io.read_point_cloud(filename)
print("Loaded pcd")

# Downsample pcd
pcd = pcd.voxel_down_sample(voxel_size=0.05)
print("Downsampled pcd")

# compute unit normal vectors
normals = np.asarray(pcd.normals)
normals = normals[::100, :]
magnitudes = np.linalg.norm(normals, axis=1)
magnitudes[magnitudes==0] = 1e-6 # set 0 magnitude to very small value
unit_normals = normals / magnitudes.reshape(-1, 1)
nx = unit_normals[:, 0]
ny = unit_normals[:, 1]
nz = unit_normals[:, 2]

# plot in plotly
fig = go.Figure(data=[go.Scatter3d(x=nx, y=ny, z=nz, mode='markers', 
        marker=dict(
            size=2,
            color='#FF6692'
        ))
    ])
fig.show()
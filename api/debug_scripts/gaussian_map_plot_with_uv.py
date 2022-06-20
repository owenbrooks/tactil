import numpy as np
import open3d as o3d
import sys
import plotly.graph_objects as go
from sklearn.cluster import MeanShift, estimate_bandwidth
from pcd_operations import dbscan_cluster, remove_small_clusters

def main():
    # Load pcd
    print("Loading pcd")
    filename = sys.argv[1]
    pcd = o3d.io.read_point_cloud(filename)
    print("Loaded pcd")

    # Downsample pcd
    pcd = pcd.voxel_down_sample(voxel_size=0.05)
    print("Downsampled pcd")

    # Remove small clusters
    labels_uv = dbscan_cluster(pcd, epsilon=0.2, min_points=10)
    min_cluster_size = 20 # points
    pcd = remove_small_clusters(pcd, labels_uv, min_point_count=min_cluster_size)
    print(f"Removed clusters smaller than {min_cluster_size} points.")
    # o3d.visualization.draw_geometries([pcd])

    # Compute unit normal vectors
    normals = np.asarray(pcd.normals)
    step = 10
    normals = normals[::step, :]
    magnitudes = np.linalg.norm(normals, axis=1)
    magnitudes[magnitudes==0] = 1e-6 # set 0 magnitude to very small value
    unit_normals = normals / magnitudes.reshape(-1, 1)
    nx = unit_normals[:, 0]
    ny = unit_normals[:, 1]
    nz = unit_normals[:, 2]

    # Plot unit normals in 3D
    fig = go.Figure(data=[go.Scatter3d(x=nx[::step], y=ny[::step], z=nz[::step], mode='markers', 
            marker=dict(
                size=2,
                color='#FF6692'
            ))
        ])
    fig.show()

    # Map to uv coordinates on unit sphere
    u = 0.5 + np.arctan2(nx, nz)/(2*np.pi)
    v = 0.5 + np.arcsin(ny) / np.pi
    fig = go.Figure(data=[go.Scatter(x=u, y=v, mode='markers')])
    # fig.show()

    # Compute clustering with MeanShift in uv space
    X_uv = np.stack([u, v], axis=1)
    bandwidth_uv = estimate_bandwidth(X_uv, quantile=0.1)
    ms_uv = MeanShift(bandwidth=bandwidth_uv, bin_seeding=True)
    ms_uv.fit(X_uv)
    labels_uv = ms_uv.labels_
    plot_2d(labels_uv, u, v, step)
    plot_3d(labels_uv, nx, ny, nz, step)

    # Compute clustering with MeanShift in xyz space
    bandwidth_xyz = estimate_bandwidth(unit_normals, quantile=0.1)
    ms_xyz = MeanShift(bandwidth=bandwidth_xyz, bin_seeding=True)
    ms_xyz.fit(unit_normals)
    labels_xyz = ms_xyz.labels_
    plot_2d(labels_xyz, u, v, step)
    plot_3d(labels_xyz, nx, ny, nz, step)


def plot_2d(labels, u, v, step):
    # Plot 2D uv scatter plot
    step = 10
    layout = go.Layout(
        # title="Title",
        xaxis=dict(
            title="u"
        ),
        yaxis=dict(
            title="v"
    ) ) 
    fig = go.Figure(layout=layout, data=[go.Scatter(x=u[::step], y=v[::step], mode='markers',
        marker=dict(
            color=labels[::step]/(np.max(labels)+1),
            # colorscale='sunsetdark',
            size=6
        ))])
    fig.show()

def plot_3d(labels, nx, ny, nz, step):
    # Plot 3D gaussian map
    fig = go.Figure(data=[go.Scatter3d(x=nx[::step], y=ny[::step], z=nz[::step], mode='markers', 
            marker=dict(
                color=labels[::step]/(np.max(labels)+1),
                # colorscale='sunsetdark',
                size=2
            ))
        ])
    fig.show()

if __name__ == "__main__":
    main()
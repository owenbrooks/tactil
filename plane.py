import numpy as np
import open3d as o3d
import sys

# Load pcd
print("Loading pcd")
filename = sys.argv[1]
pcd = o3d.io.read_point_cloud(filename)

# Downsample pcd
downpcd = pcd.voxel_down_sample(voxel_size=0.05)
pcd = downpcd
# o3d.visualization.draw_geometries([pcd], point_show_normal=True)

# Filter out for only points that have close to horizontal normals
normals = np.asarray(downpcd.normals)
vertical = np.array([0.0, 1.0, 0.0])
dot = np.array([np.dot(vertical, norm) for norm in normals])
horz_norms = np.arange(len(dot))[np.abs(dot)<0.1]
pcd = pcd.select_by_index(horz_norms)
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)

def display_inlier_outlier(cloud, ind):
    inlier_cloud = cloud.select_by_index(ind)
    outlier_cloud = cloud.select_by_index(ind, invert=True)

    print("Showing outliers (red) and inliers (gray): ")
    outlier_cloud.paint_uniform_color([1, 0, 0])
    inlier_cloud.paint_uniform_color([0.8, 0.8, 0.8])
    o3d.visualization.draw_geometries([inlier_cloud, outlier_cloud])

# Remove outliers
print("Statistical oulier removal")
cl, ind = pcd.remove_statistical_outlier(nb_neighbors=300,
                                                    std_ratio=2.0)
display_inlier_outlier(pcd, ind)
in_pcd = pcd.select_by_index(ind)
o3d.visualization.draw_geometries([in_pcd])

print("Radius outlier removal")
cl, ind = pcd.remove_radius_outlier(nb_points=30, radius=0.15)
display_inlier_outlier(pcd, ind)
in_pcd = pcd.select_by_index(ind)
o3d.visualization.draw_geometries([in_pcd])
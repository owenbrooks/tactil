import matplotlib.pyplot as plt
import numpy as np
import open3d as o3d
import sys

print("Loading pcd")
filename = sys.argv[1]
pcd = o3d.io.read_point_cloud(filename)

downpcd = pcd.voxel_down_sample(voxel_size=0.05)
pcd = downpcd
#o3d.visualization.draw_geometries([pcd], point_show_normal=True)

points = np.asarray(pcd.points)
#new_points = points[points[:, 1] < float(sys.argv[2])]
#pcd.points = o3d.utility.Vector3dVector(new_points)

normals = np.asarray(downpcd.normals)
print(normals)

# try to filter out for only points that have close to horizontal normals
vertical = np.array([0.0, 1.0, 0.0])
dot = np.array([np.dot(vertical, norm) for norm in normals])
new_points = points[dot > 0.8]
#pcd.points = o3d.utility.Vector3dVector(new_points)
horz_norms = np.arange(len(dot))[np.abs(dot)<0.1]
pcd = pcd.select_by_index(horz_norms)
print(len(points))
print(len(new_points))
o3d.visualization.draw_geometries([pcd], point_show_normal=False)
# plane detection
plane_model, inliers = pcd.segment_plane(distance_threshold=0.1,
                                         ransac_n=3,
                                         num_iterations=1000)
[a, b, c, d] = plane_model
print(f"Plane equation: {a:.2f}x + {b:.2f}y + {c:.2f}z + {d:.2f} = 0")

#inlier_cloud = pcd.select_by_index(inliers)
#inlier_cloud.paint_uniform_color([1.0, 0, 0])
#outlier_cloud = pcd.select_by_index(inliers, invert=True)
#o3d.visualization.draw_geometries([inlier_cloud, outlier_cloud])
#o3d.visualization.draw_geometries([outlier_cloud], point_show_normal=True)

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
downpcd = pcd.voxel_down_sample(voxel_size=0.05)
pcd = downpcd
print("Downsampled pcd")
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)

# Max vertical threhold
# print(np.asarray(pcd.points).shape)
points = np.asarray(pcd.points)
remaining = points[:, 1] < 2.0
pcd = pcd.select_by_index(np.arange(len(remaining))[remaining])
print(np.asarray(pcd.points).shape)
o3d.visualization.draw_geometries([pcd], point_show_normal=False)


# Perform plane segmentation
segment_models={}
segments={}
rest = pcd
max_plane_idx = 10
rest.paint_uniform_color([0.8, 0.8, 0.8])

for i in range(max_plane_idx):
    colours = plt.get_cmap("tab20")(i)
    segment_models[i], inliers = rest.segment_plane(
    distance_threshold=0.05,ransac_n=3,num_iterations=1000)
    segments[i]=rest.select_by_index(inliers)
    segments[i].paint_uniform_color(list(colours[:3]))
    rest = rest.select_by_index(inliers, invert=True)
    print("pass",i,"/",max_plane_idx,"done.")
    
o3d.visualization.draw_geometries([segments[i] for i in range(max_plane_idx)]+[rest])

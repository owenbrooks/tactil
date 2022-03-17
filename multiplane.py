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
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)


# Max vertical threhold
points = np.asarray(pcd.points)
remaining = points[:, 1] < 2.2
pcd = pcd.select_by_index(np.arange(len(remaining))[remaining])
print(np.asarray(pcd.points).shape)
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)


# # Perform plane segmentation to filter out ground points
# ground_plane, inliers = pcd.segment_plane(
#     distance_threshold=0.05,ransac_n=3,num_iterations=1000)
# ground = pcd.select_by_index(inliers)
# ground.paint_uniform_color([1.0, 0.0, 0.0])
# # o3d.visualization.draw_geometries([pcd], point_show_normal=False)
# pcd = pcd.select_by_index(inliers, invert=True)
# # o3d.visualization.draw_geometries([pcd], point_show_normal=False)

# Filter out for only points that have close to horizontal normals
normals = np.asarray(pcd.normals)
vertical = np.array([0.0, 1.0, 0.0])
dot = np.array([np.dot(vertical, norm) for norm in normals])
horz_norms = np.arange(len(dot))[np.abs(dot)<0.2]
pcd = pcd.select_by_index(horz_norms)
print(f"Filtered for horizontal normals, new length: {np.asarray(pcd.points).shape[0]}")
# o3d.visualization.draw_geometries([pcd], point_show_normal=False)


# Cluster using dbscan
with o3d.utility.VerbosityContextManager(
        o3d.utility.VerbosityLevel.Debug) as cm:
    labels = np.array(pcd.cluster_dbscan(eps=0.1, min_points=10, print_progress=True))
    # for an nx3 pcd, labels is nx1 integers, with -1 representing noise points, 
    # and positive ints and 0 indicating which cluster a point belongs to
max_label = labels.max()
print(f"Point cloud has {max_label + 1} clusters")
colors = plt.get_cmap("tab20")(labels / (max_label if max_label > 0 else 1))
colors[labels < 0] = 0
pcd.colors = o3d.utility.Vector3dVector(colors[:, :3])
# o3d.visualization.draw_geometries([pcd])


# Remove small clusters
noise_label = np.amax(labels)+1
labels[labels == -1] = noise_label # need all non-negative for bincount
count = np.bincount(labels)
large_cluster_labels = np.unique(labels)[count > 800]
noise_points = np.argwhere(large_cluster_labels == noise_label)
large_cluster_labels = np.delete(large_cluster_labels, noise_points) # remove noise points which might otherwise form a big cluster
is_large_cluster = np.in1d(labels, large_cluster_labels)
larger_cluster_indices = np.arange(np.asarray(pcd.points).shape[0])[is_large_cluster]
pcd = pcd.select_by_index(larger_cluster_indices)
print("Removed small clusters")
# o3d.visualization.draw_geometries([pcd])


# Perform plane segmentation and get bounding boxes for vertical planes
segment_models=[]
segments=[]
rest = pcd
max_plane_idx = 15
rest.paint_uniform_color([0.8, 0.8, 0.8])

for i in range(max_plane_idx):
    colours = plt.get_cmap("tab20")(i)
    try:
        plane_model, inliers = rest.segment_plane(
        distance_threshold=0.05,ransac_n=3,num_iterations=1000)
        # filter for vertical planes (horizontal normals)
        normal = plane_model[0:3]
        vertical = np.array([0.0, 1.0, 0.0])
        print(np.dot(vertical, normal))
        is_vertical = np.dot(vertical, normal) < 0.5
        if is_vertical:
            segment_models.append(plane_model)
            segment = rest.select_by_index(inliers)
            segment.paint_uniform_color(list(colours[:3]))
            segments.append(segment)
            rest = rest.select_by_index(inliers, invert=True)
            print("accepted")
        else:
            print("rejected")
    except:
        break
    
    print("pass",i+1,"/",max_plane_idx,"done.")


# Ensure each plane is made up of only the largest contiguous cluster that fit
for i in range(len(segments)):
    seg_pcd = segments[i]
    seg_model = segment_models[i]
    with o3d.utility.VerbosityContextManager(
        o3d.utility.VerbosityLevel.Debug) as cm:
        labels = np.array(seg_pcd.cluster_dbscan(eps=0.1, min_points=10, print_progress=True))
        max_label = labels.max()


        # Remove small clusters
        noise_label = np.amax(labels)+1
        labels[labels == -1] = noise_label # need all non-negative for bincount
        count = np.bincount(labels)
        large_cluster_labels = np.unique(labels)[count > 800]
        noise_points = np.argwhere(large_cluster_labels == noise_label)
        large_cluster_labels = np.delete(large_cluster_labels, noise_points) # remove noise points which might otherwise form a big cluster
        is_large_cluster = np.in1d(labels, large_cluster_labels)
        larger_cluster_indices = np.arange(np.asarray(seg_pcd.points).shape[0])[is_large_cluster]
        segments[i] = seg_pcd.select_by_index(larger_cluster_indices)
        print("Removed small clusters")

    # o3d.visualization.draw_geometries([seg_pcd])


# Find and draw oriented bounding boxes
line_sets = []
for i in range(len(segments)):
    print(segment_models[i], segments[i])
    extent = segments[i].get_oriented_bounding_box()
    line_set = o3d.geometry.LineSet.create_from_oriented_bounding_box(extent)
    colors = [[1, 0, 0] for i in range(12)]
    line_set.colors = o3d.utility.Vector3dVector(colors)
    line_sets.append(line_set)
    
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

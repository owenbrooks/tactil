import open3d as o3d
import sys
from tactil_api.pcd_operations import vertical_threshold

pcd_path = sys.argv[1]
print(pcd_path)
pcd = o3d.io.read_point_cloud(pcd_path)

pcd = vertical_threshold(pcd, 2.0)

o3d.visualization.draw_geometries([pcd])

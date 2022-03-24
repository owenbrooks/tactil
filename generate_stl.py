import numpy as np
import os
from stl import mesh
from scipy.spatial.transform import Rotation as R

def main():
    # load data of wall bounding boxes from numpy files
    with open('output/centres.npy', 'rb') as f:
        centers_unscaled = np.load(f)
    with open('output/extents.npy', 'rb') as f:
        extents_unscaled = np.load(f)
    with open('output/rotations.npy', 'rb') as f:
        rotations = np.load(f)

    # swap column order since STL expects [x, y, z] while open3D had [x, z, y]
    centers_unscaled[:, [2, 1]] = centers_unscaled[:, [1, 2]]
    extents_unscaled[:, [2, 1]] = extents_unscaled[:, [1, 2]]

    # scale dimensions down to model size
    model_scale_factor = 1/16
    centers = centers_unscaled * model_scale_factor
    extents = extents_unscaled * model_scale_factor

    # define the 8 vertices of a cube
    cube_vertices = np.array([\
        [-1., -1., -1.],
        [+1., -1., -1.],
        [+1., +1., -1.],
        [-1., +1., -1.],
        [-1., -1., +1.],
        [+1., -1., +1.],
        [+1., +1., +1.],
        [-1., +1., +1.]])

    # define the 12 triangles composing a cube
    cube_faces = np.array([\
        [0,3,1],
        [1,3,2],
        [0,4,7],
        [0,7,3],
        [4,5,6],
        [4,6,7],
        [5,1,2],
        [5,2,6],
        [2,3,6],
        [3,7,6],
        [0,1,5],
        [0,5,4]])

    box_meshes = []
    for box_index in range(centers.shape[0]):
        center = centers[box_index]
        extent = extents[box_index]
        rot = rotations[box_index]

        # scale
        vert = cube_vertices.copy()
        wall_height = 0.04 
        vert[:, 2] *= wall_height / 2
        vert[:, 2] += wall_height / 2
        wall_thickness = 0.02
        extent[1] = wall_thickness # TODO: remove this / make a minimum
        vert[:, 0:2] *= extent[0:2]/2 # apply scale in x and y directions

        # rotate
        r = R.from_matrix(rot)
        euler_r = r.as_euler('xyz')
        euler_r[2] = euler_r[1].copy() # switch y and z axes (open3d convention vs STL) so that z becomes vertical
        euler_r[0] = 0 # zero out x axis rotation
        euler_r[1] = 0 # zero out y axis rotation
        r = R.from_euler('xyz', euler_r)
        rot = r.as_matrix()
        vert_rotated = vert @ rot

        # translate
        vert_transformed = vert_rotated.copy()
        vert_transformed[:, 0:3] += center

        # create mesh
        box_mesh = mesh.Mesh(np.zeros(cube_faces.shape[0], dtype=mesh.Mesh.dtype))
        for i, f in enumerate(cube_faces):
            for j in range(3):
                box_mesh.vectors[i][j] = vert_transformed[f[j],:] 

        box_meshes.append(box_mesh)

    # Combine boxes into a single large mesh to be printed
    walls_mesh = mesh.Mesh(np.concatenate([cube.data for cube in box_meshes]))

    # print(vert_transformed)
    minx, maxx, miny, maxy = walls_mesh.x.min(), walls_mesh.x.max(), walls_mesh.y.min(), walls_mesh.y.max() 
    floor_vert = np.array([\
        [minx, miny, -1.],
        [maxx, miny, -1.],
        [maxx, maxy, -1.],
        [minx, maxy, -1.],
        [minx, miny, +1.],
        [maxx, miny, +1.],
        [maxx, maxy, +1.],
        [minx, maxy, +1.]])
    floor_vert[:, 2] -= 1
    floor_vert[:, 2] *= 0.5
    floor_vert[:, 2] *= 0.01
    floor_mesh = mesh.Mesh(np.zeros(cube_faces.shape[0], dtype=mesh.Mesh.dtype))
    for i, f in enumerate(cube_faces):
        for j in range(3):
            floor_mesh.vectors[i][j] = floor_vert[f[j],:] 

    combined_mesh = mesh.Mesh(np.concatenate([cube.data for cube in box_meshes] + [floor_mesh.data]))
    combined_mesh.save(os.path.join('output', 'out.stl'))

    display_meshes([combined_mesh])

    # display_meshes(box_meshes)


def display_meshes(meshes):
    # Optionally render the rotated cube faces
    from matplotlib import pyplot
    from mpl_toolkits import mplot3d

    # Create a new plot
    figure = pyplot.figure()
    axes = mplot3d.Axes3D(figure)

    # Render the cube faces
    for m in meshes:
        axes.add_collection3d(mplot3d.art3d.Poly3DCollection(m.vectors))

    # Auto scale to the mesh size
    scale = np.concatenate([m.points for m in meshes]).flatten()
    axes.auto_scale_xyz(scale, scale, scale)

    # Show the plot to the screen
    pyplot.show()

if __name__ == "__main__":
    main()
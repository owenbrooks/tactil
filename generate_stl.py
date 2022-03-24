import numpy as np
from stl import mesh
from scipy.spatial.transform import Rotation as R

def main():
    with open('output/centres.npy', 'rb') as f:
        centers = np.load(f)
    with open('output/extents.npy', 'rb') as f:
        extents = np.load(f)
    with open('output/rotations.npy', 'rb') as f:
        rotations = np.load(f)

    # swap column order since STL expects [x, y, z] while open3D had [x, z, y]
    centers[:, [2, 1]] = centers[:, [1, 2]]
    extents[:, [2, 1]] = extents[:, [1, 2]]
    # permute_mat = np.array([[1,0,0], [0,1,0], [0,0,1]])
    # permute_mat = np.array([[1,0,0], [0,0,1], [0,1,0]])
    # permute_mat = np.array([[0,0,1], [0,1,0], [0,0,1]])
    # permute_mat = np.array([[0,1,0], [0,0,1], [1,0,0]])
    # print(rotations)
    # rotations = rotations @ permute_mat.T
    # print(rotations)

    print(centers[0], extents[0])

    # print(centers, extents, rotations)
    wall_height = 1

    # Define the 8 vertices of the cube
    vertices = np.array([\
        [-1., -1., -1.],
        [+1., -1., -1.],
        [+1., +1., -1.],
        [-1., +1., -1.],
        [-1., -1., +1.],
        [+1., -1., +1.],
        [+1., +1., +1.],
        [-1., +1., +1.]])

    # Define the 12 triangles composing the cube
    faces = np.array([\
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

    cubes = []
    for box_index in range(centers.shape[0]):
        center = centers[box_index]
        extent = extents[box_index]
        rot = rotations[box_index]
        print(rot)

        r = R.from_matrix(rot)
        euler_r = r.as_euler('xyz')
        print(np.rad2deg(euler_r))
        euler_r[0] = 0
        euler_r[2] = euler_r[1].copy()
        euler_r[1] = 0
        print(np.rad2deg(euler_r))

        # r = R.from_euler(seq='xyz', angles=np.deg2rad([0, 10, 45]))
        r = R.from_euler('xyz', euler_r)
        rot = r.as_matrix()
        # print(rot)

        # scale
        vert = vertices.copy()
        vert[:, 2] *= wall_height / 2
        vert[:, 2] += wall_height / 2
        extent[1] = 0.1 # TODO: remove this / make a minimum
        vert[:, 0:2] *= extent[0:2]/2 # apply scale in x and y directions

        # rotate
        vert_rotated = vert
        vert_rotated = vert @ rot

        # translate
        vert_rotated[:, 0:3] += center[0:3]

        cube = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
        for i, f in enumerate(faces):
            for j in range(3):
                cube.vectors[i][j] = vert_rotated[f[j],:] 

        cubes.append(cube)
        # break
        print(box_index)
        # if box_index == 3:
        #     break


    render_meshes(cubes)


def render_meshes(meshes):
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
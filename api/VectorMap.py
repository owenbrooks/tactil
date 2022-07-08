# from dataclasses import dataclass
from marshmallow_dataclass import dataclass
from math import sqrt
from typing import Dict, Union
import numpy as np

@dataclass
class Coord2D:
    x: float
    y: float

@dataclass
class Vertex:
    id: int
    position: Coord2D

@dataclass
class Edge:
    id: int
    vertex_id_a: int
    vertex_id_b: int

@dataclass
class Label:
    id: int
    text: str
    position: Coord2D
    size: int
    is_braille: bool

def apply_z_rot(point: Coord2D, angle_rad: float) -> Coord2D:
    cos_theta = np.cos(angle_rad)
    sin_theta = np.sin(angle_rad)
    x = point.x * cos_theta + point.y * sin_theta
    y = point.x * sin_theta - point.y * cos_theta
    return Coord2D(x, y)

def apply_translation(coord: Coord2D, translation: Coord2D) -> Coord2D:
    return Coord2D(coord.x + translation.x, coord.y + translation.y)

@dataclass
class VectorMap:
    """ Class for storing a 2D vector representation of an indoor map """
    features: Dict[int, Union[Label, Vertex, Edge]]
    vertices: list[int]
    edges: list[int]
    labels: list[int]

    @classmethod
    def from_boxes(cls, centers, extents, rotations):
        vertices = []
        edges = []
        features: Dict[int, Union[Label, Vertex, Edge]] = dict()

        for center, extent, rotation in zip(centers, extents, rotations):

            z_rot_euler = np.arctan2(rotation[1][0], rotation[0][0])
            x_coord = extent[0] / 2
            x_coord_pos = np.max(x_coord, 0)
            x_coord_neg = np.min(-x_coord, 0)

            center_coord = Coord2D(center[0], center[1])
            vert_a_no_transform = apply_z_rot(Coord2D(x_coord_neg, 0), z_rot_euler)
            vert_b_no_transform = apply_z_rot(Coord2D(x_coord_pos, 0), z_rot_euler)
            vert_a_coord = apply_translation(vert_a_no_transform, center_coord)
            vert_b_coord = apply_translation(vert_b_no_transform, center_coord)

            maxId = len(features) - 1 # Find new ids according to current max id
            
            vertex_a_id = maxId+1
            vertex_b_id = maxId+2
            edge_id = maxId+3

            vertex_a = Vertex(vertex_a_id, vert_a_coord)
            vertex_b = Vertex(vertex_b_id, vert_b_coord)
            edge = Edge(edge_id, vertex_a.id, vertex_b.id)

            vertices += [vertex_a.id, vertex_b.id]
            edges += [edge.id]

            features[vertex_a_id] = vertex_a
            features[vertex_b_id] = vertex_b
            features[edge_id] = edge

        labels = []

        return cls(features, vertices, edges, labels)

def euclidean_distance(coord_a: Coord2D, coord_b: Coord2D) -> float:
    return sqrt((coord_a.x-coord_b.x)**2 + (coord_a.y-coord_b.y)**2)
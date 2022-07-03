from dataclasses import dataclass

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

@dataclass
class VectorMap:
    """ Class for storing a 2D vector representation of an indoor map """
    features: list[Vertex, Edge, Label]

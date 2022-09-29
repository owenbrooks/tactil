class VectorMap:
    """ Class for storing a 2D vector representation of an indoor map

    :param vertices:
    :param edges:
    """
    vertices: dict[int, Vertex]
    edges: dict[int, Edge]
    def __init__(self, vertices: dict[int, Vertex], edges: dict[int, Edge]) -> None: ...

class Edge:
    """ Class representing a wall 
    :param id: numeric identifier
    :param vertex_id_a:
    :param vertex_id_b:
    """
    id: int
    vertex_id_a: int
    vertex_id_b: int
    def __init__(self, id: int, vertex_id_a: int, vertex_id_b: int) -> None: ...

class Vertex:
    """ Class representing a wall 
    :param id: numeric identifier
    :param position:
    """
    id: int
    position: Coord2D
    def __init__(self, id: int, position: Coord2D) -> None: ...

class Coord2D:
    """ Class representing a wall 
    :param x: x coordinate
    :param y: y coordinate
    """
    x: float
    y: float
    def __init__(self, x: float, y: float) -> None: ...
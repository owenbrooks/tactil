from tactil_api.VectorMap import *
from tactil_rs import print_vec_map

vec1 = Vertex(id=1, position=Coord2D(x=1, y=2))
vec2 = Vertex(id=2, position=Coord2D(x=1, y=5))
edge1 = Edge(id=3, vertex_id_a=1, vertex_id_b=2)
vec3 = Vertex(id=4, position=Coord2D(x=1.1, y=2.1))
vec4 = Vertex(id=5, position=Coord2D(x=2, y=3))
edge2 = Edge(id=6, vertex_id_a=4, vertex_id_b=5)

vmap = VectorMap(features={1: vec1, 2: vec2, 3: edge1, 4: vec3, 5: vec4, 6: edge2}, vertices=[1, 2, 4, 5], edges=[3, 6], labels=[])
print_vec_map(vmap)
from tactil_api.VectorMap import fromBasic, toBasic
from tactil_rs import print_vec_map, print_coord, Coord2D, VectorMap as BasicVectorMap, Vertex, Edge

vec1 = Vertex(id=1, position=Coord2D(x=1, y=2))
vec2 = Vertex(id=2, position=Coord2D(x=1, y=5))
edge1 = Edge(id=3, vertex_id_a=1, vertex_id_b=2)
vec3 = Vertex(id=4, position=Coord2D(x=1.1, y=2.1))
vec4 = Vertex(id=5, position=Coord2D(x=2, y=3))
edge2 = Edge(id=6, vertex_id_a=4, vertex_id_b=5)

vertices = {1: vec1, 2: vec2, 4: vec3, 5: vec4}
edges = {3: edge1, 6: edge2}

vmap = BasicVectorMap(vertices, edges)
print(vmap.vertices)
print_vec_map(vmap)

normal = fromBasic(vmap)
print(normal)

basic = toBasic(normal)
print(basic)

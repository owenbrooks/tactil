use std::collections::HashMap;
use std::collections::HashSet;
use tactil_rs::print_vec_map;
use tactil_rs::vector_map::*;

#[test]
fn can_draw_map() -> () {
    let vec1 = Vertex {
        id: 1,
        position: Coord2D { x: 1., y: 2. },
    };
    let vec2 = Vertex {
        id: 2,
        position: Coord2D { x: 1., y: 5. },
    };
    let vec3 = Vertex {
        id: 4,
        position: Coord2D { x: 1.1, y: 2.1 },
    };
    let vec4 = Vertex {
        id: 5,
        position: Coord2D { x: 2., y: 3. },
    };
    
    let mut vmap = VectorMap {
        features: HashMap::new(),
        vertices: HashSet::new(),
        edges: HashSet::new(),
        labels: HashSet::new(),
    };
    vmap.add_vertex(&vec1.position);
    vmap.add_vertex(&vec2.position);
    vmap.add_vertex(&vec3.position);
    vmap.add_vertex(&vec4.position);
    vmap.add_edge(1, 2);
    vmap.add_edge(3, 4);

    print_vec_map(vmap)
}

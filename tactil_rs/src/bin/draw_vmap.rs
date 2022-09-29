use macroquad::prelude::*;
use std::collections::HashMap;
use std::collections::HashSet;
use tactil_rs::{simplify, vector_map};

#[macroquad::main("tactil")]
async fn main() {
//     let vec1 = vector_map::Vertex {
//         id: 1,
//         position: vector_map::Coord2D { x: 1., y: 2. },
//     };
//     let vec2 = vector_map::Vertex {
//         id: 2,
//         position: vector_map::Coord2D { x: 1., y: 5. },
//     };
//     let vec3 = vector_map::Vertex {
//         id: 4,
//         position: vector_map::Coord2D { x: 1.5, y: 2.1 },
//     };
//     let vec4 = vector_map::Vertex {
//         id: 5,
//         position: vector_map::Coord2D { x: 2., y: 3. },
//     };

//     let mut vmap = vector_map::VectorMap {
//         features: HashMap::new(),
//         vertices: HashSet::new(),
//         edges: HashSet::new(),
//         labels: HashSet::new(),
//     };
//     vmap.add_vertex(&vec1.position);
//     vmap.add_vertex(&vec2.position);
//     vmap.add_vertex(&vec3.position);
//     vmap.add_vertex(&vec4.position);
//     vmap.add_edge(1, 2);
//     vmap.add_edge(3, 4);

//     let vmap = simplify::merge_near_vertices(vmap, 0.6).unwrap();
//     loop {
//         draw_map(&vmap).await
//     }
// }

// async fn draw_map(vec_map: &vector_map::VectorMap) {
//     clear_background(RED);

//     let world_to_pixel_factor = 40.;

//     for &vertex_id in &vec_map.vertices {
//         if let Some(vertex) = vec_map.get_vertex(vertex_id) {
//             draw_circle(
//                 screen_width() / 2. + world_to_pixel_factor * vertex.position.x,
//                 screen_height() / 2. + world_to_pixel_factor * vertex.position.y,
//                 12.,
//                 GREEN,
//             );
//         }
//     }

//     for &edge_id in &vec_map.edges {
//         if let Some(edge) = vec_map.get_edge(edge_id) {
//             if let Some(vert_a) = vec_map.get_vertex(edge.vertex_id_a) {
//                 if let Some(vert_b) = vec_map.get_vertex(edge.vertex_id_b) {
//                     draw_line(
//                         screen_width() / 2. + world_to_pixel_factor * vert_a.position.x,
//                         screen_height() / 2. + world_to_pixel_factor * vert_a.position.y,
//                         screen_width() / 2. + world_to_pixel_factor * vert_b.position.x,
//                         screen_height() / 2. + world_to_pixel_factor * vert_b.position.y,
//                         5.0,
//                         GREEN,
//                     );
//                 }
//             }
//         }
//     }

//     next_frame().await
}

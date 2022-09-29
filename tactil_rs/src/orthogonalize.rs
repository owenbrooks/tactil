use crate::vector_map::{Coord2D, Edge, VectorMap, Vertex};
use pyo3::{pyclass, pyfunction, PyResult};
use std::f32::consts;

// returns angle made by vector ab and the x axis, between -pi/2 and pi/2
fn get_angle(position_a: Coord2D, position_b: Coord2D) -> f32 {
    let dy = position_b.y - position_a.y;
    let dx = position_b.x - position_a.x;
    let angle = f32::atan(dy / dx);
    angle
}

// Unable to return the actual VectorMap type since pyO3 doesn't currently support enums
#[pyclass]
pub struct VerticesAndEdges {
    pub vertices: Vec<Vertex>,
    pub edges: Vec<Edge>,
}

// Input: VectorMap containing vertices representing wall corners, and edges representing the walls themselves
// Output: Similar VectorMap, with walls that were close to vertical or horizontal snapped to these directions
#[pyfunction]
pub fn orthogonalize_map(vmap: VectorMap, angle_threshold_rad: f32) -> PyResult<VectorMap> {
    let mut new_vmap = vmap.clone();
    for (&_, &edge) in &new_vmap.edges {
        let vert_a = new_vmap.vertices.get(&edge.vertex_id_a).unwrap();
        let vert_b = new_vmap.vertices.get(&edge.vertex_id_b).unwrap();
        let angle = get_angle(vert_a.position, vert_b.position);

        if (consts::FRAC_PI_2 - angle).abs() < angle_threshold_rad
            || (-consts::FRAC_PI_2 - angle).abs() < angle_threshold_rad
        {
            // snap to vertical line
            let new_x = (vert_a.position.x + vert_b.position.x) / 2.;

            // create new vertices
            let new_vertex_a = Vertex {
                id: edge.vertex_id_a,
                position: Coord2D {
                    x: new_x,
                    y: vert_a.position.y,
                },
            };
            let new_vertex_b = Vertex {
                id: edge.vertex_id_b,
                position: Coord2D {
                    x: new_x,
                    y: vert_b.position.y,
                },
            };
            // insert into vectormap
            new_vmap.vertices.insert(edge.vertex_id_a, new_vertex_a);
            new_vmap.vertices.insert(edge.vertex_id_b, new_vertex_b);
        } else if angle.abs() < angle_threshold_rad {
            // snap to horizontal line
            let new_y = (vert_a.position.y + vert_b.position.y) / 2.;
            // create new vertices
            let new_vertex_a = Vertex {
                id: edge.vertex_id_a,
                position: Coord2D {
                    x: vert_a.position.x,
                    y: new_y,
                },
            };
            let new_vertex_b = Vertex {
                id: edge.vertex_id_b,
                position: Coord2D {
                    x: vert_b.position.x,
                    y: new_y,
                },
            };
            // insert into vectormap
            new_vmap.vertices.insert(edge.vertex_id_a, new_vertex_a);
            new_vmap.vertices.insert(edge.vertex_id_b, new_vertex_b);
        }
    }

    Ok(new_vmap)
}

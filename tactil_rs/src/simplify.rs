use crate::vector_map::{Edge, VectorMap};
use pyo3::{pyfunction, PyResult};

// Input: VectorMap containing vertices representing wall corners, and edges representing the walls themselves.
// Output: Similar VectorMap, with vertices that were within merge_radius distance from each other merged into a single vertex
#[pyfunction]
pub fn merge_near_vertices(vmap: VectorMap, merge_radius: f32) -> PyResult<VectorMap> {
    let mut new_vmap = vmap.clone();
    // Find vertices that are within merge_radius of each other
    // and are therefore considered equivalent
    let equivalent_vertices = {
        let mut equivalent_vertices = vec![];
        let vertices: Vec<&usize> = new_vmap.vertices.iter().map(|(id, _)| id).collect();
        // iterate over pairs of IDs, checking distance criterion
        for (i, &&id_a) in vertices.iter().enumerate() {
            for &&id_b in vertices[i + 1..].iter() {
                let vert_a = new_vmap.vertices.get(&id_a);
                let vert_b = new_vmap.vertices.get(&id_b);
                if let (Some(vert_a), Some(vert_b)) = (vert_a, vert_b) {
                    let distance = f32::sqrt(
                        (vert_a.position.x - vert_b.position.x).powf(2.)
                            + (vert_a.position.y - vert_b.position.y).powf(2.),
                    );
                    if distance < merge_radius {
                        equivalent_vertices.push((id_a, id_b));
                    }
                } else {
                    // TODO: return error
                }
            }
        }
        equivalent_vertices
    };

    // Keep vert_a, replace vert_b with vert_a
    let vmap_edges = new_vmap.edges.clone();
    for (vert_a, vert_b) in equivalent_vertices {
        // Update the edges to point to vert_a
        for (&edge_id, _) in &vmap_edges {
            let edge = new_vmap.edges.get(&edge_id);
            if let Some(edge) = edge {
                if edge.vertex_id_a == vert_b {
                    if edge.vertex_id_b == vert_a {
                        // edges collapses on itself: remove edge
                        // edges_to_remove.push(edge_id);
                        new_vmap.remove_edge(edge_id);
                    } else {
                        // update edge
                        let new_edge = Edge {
                            id: edge.id,
                            vertex_id_a: vert_a,
                            vertex_id_b: edge.vertex_id_b,
                        };
                        new_vmap.edges.insert(edge_id, new_edge);
                    }
                } else if edge.vertex_id_b == vert_b {
                    if edge.vertex_id_a == vert_a {
                        // edges collapses on itself: remove edge
                        // edges_to_remove.push(edge_id)
                        new_vmap.remove_edge(edge_id);
                    } else {
                        // update edge
                        let new_edge = Edge {
                            id: edge.id,
                            vertex_id_a: edge.vertex_id_a,
                            vertex_id_b: vert_a,
                        };
                        new_vmap.edges.insert(edge_id, new_edge);
                    }
                }
            }
        }
        // Remove vert_b
        new_vmap.remove_vertex(vert_b);
    }

    Ok(new_vmap)
    // TODO: remove edges that have become redundant (i.e. two or more edges join the same pair of vertices)
}

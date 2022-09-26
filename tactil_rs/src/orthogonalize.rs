use pyo3::pyfunction;
use crate::vector_map::{Edge, Feature, VectorMap};

fn get_edge_angle(edge_id: usize, vmap: &VectorMap) {
    let edge = vmap.get_edge(edge_id);
    let vert_a = vmap.get_vertex(edge.vertex_id_a);
    let vert_b = vmap.get_vertex(edge.vertex_id_b);

    let gradient = (vert_b.position.y - vert_a.position.y) / (vert_b.position.x - vert_a.position.x);
    
}
// Input: VectorMap containing vertices representing wall corners, and edges representing the walls themselves
// Output: Similar VectorMap, with walls that were close to vertical or horizontal snapped to these directions
#[pyfunction]
// for edge in edges
// if edge close to vertical, snap to vertical
// else if edge close to horizontal, snap to horizontal
pub fn orthogonalize_map(vmap: &mut VectorMap, angle_threshold_rad: f32) {
    for edge_id in &vmap.edges {
        
    }
    // Find vertices that are within merge_radius of each other
    // and are therefore considered equivalent
    let equivalent_vertices = {
        let mut equivalent_vertices = vec![];
        let vertices: Vec<&usize> = vmap.vertices.iter().collect();
        // iterate over pairs of IDs, checking distance criterion
        for (i, &&id_a) in vertices.iter().enumerate() {
            for &&id_b in vertices[i + 1..].iter() {
                let vert_a = vmap.get_vertex(id_a);
                let vert_b = vmap.get_vertex(id_b);
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
    let vmap_edges = vmap.edges.clone();
    for (vert_a, vert_b) in equivalent_vertices {
        // Update the edges to point to vert_a
        for &edge_id in &vmap_edges {
            let edge = vmap.get_edge(edge_id);
            if let Some(edge) = edge {
                if edge.vertex_id_a == vert_b {
                    if edge.vertex_id_b == vert_a {
                        // edges collapses on itself: remove edge
                        // edges_to_remove.push(edge_id);
                        vmap.remove_edge(edge_id);
                    } else {
                        // update edge
                        let new_edge = Edge {
                            id: edge.id,
                            vertex_id_a: vert_a,
                            vertex_id_b: edge.vertex_id_b,
                        };
                        vmap.features.insert(edge_id, Feature::Edge(new_edge));
                    }
                } else if edge.vertex_id_b == vert_b {
                    if edge.vertex_id_a == vert_a {
                        // edges collapses on itself: remove edge
                        // edges_to_remove.push(edge_id)
                        vmap.remove_edge(edge_id);
                    } else {
                        // update edge
                        let new_edge = Edge {
                            id: edge.id,
                            vertex_id_a: edge.vertex_id_a,
                            vertex_id_b: vert_a,
                        };
                        vmap.features.insert(edge_id, Feature::Edge(new_edge));
                    }
                }
            }
        }
        // Remove vert_b
        vmap.remove_vertex(vert_b);
    }

    // TODO: remove edges that have become redundant (i.e. two or more edges join the same pair of vertices)
}

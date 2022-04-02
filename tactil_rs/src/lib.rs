use pyo3::prelude::*;
pub mod simplify;
pub mod vector_map;

// Take VectorMap as input
// Output VectorMap with merged nodes
#[pyfunction]
pub fn print_vec_map(vec_map: vector_map::VectorMap) {
    for &id in &vec_map.vertices {
        if let Some(vertex) = vec_map.get_vertex(id) {
            println!(
                "{}: ({:.2}, {:.2})",
                vertex.id, vertex.position.x, vertex.position.y
            );
        }
    }
    for &id in &vec_map.edges {
        if let Some(edge) = vec_map.get_edge(id) {
            println!("{}: [{}->{}]", edge.id, edge.vertex_id_a, edge.vertex_id_b);
        }
    }
}
/// A Python module implemented in Rust.
#[pymodule]
fn tactil_rs(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(print_vec_map, m)?)?;
    m.add_function(wrap_pyfunction!(simplify::merge_near_vertices, m)?)?;
    Ok(())
}

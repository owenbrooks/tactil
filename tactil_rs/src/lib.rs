use pyo3::prelude::*;
pub mod orthogonalize;
pub mod simplify;
pub mod vector_map;

// Take VectorMap as input
// Output VectorMap with merged nodes
#[pyfunction]
pub fn print_vec_map(vec_map: vector_map::VectorMap) {
    for (&_, &vertex) in &vec_map.vertices {
        println!(
            "{}: ({:.2}, {:.2})",
            vertex.id, vertex.position.x, vertex.position.y
        );
    }
    for (&_, &edge) in &vec_map.edges {
        println!("{}: [{}->{}]", edge.id, edge.vertex_id_a, edge.vertex_id_b);
    }
}
/// A Python module implemented in Rust.
#[pymodule]
fn tactil_rs(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(print_vec_map, m)?)?;
    m.add_function(wrap_pyfunction!(simplify::merge_near_vertices, m)?)?;
    m.add_function(wrap_pyfunction!(orthogonalize::orthogonalize_map, m)?)?;
    m.add_class::<vector_map::VectorMap>()?;
    m.add_class::<vector_map::Coord2D>()?;
    m.add_class::<vector_map::Vertex>()?;
    m.add_class::<vector_map::Edge>()?;
    Ok(())
}

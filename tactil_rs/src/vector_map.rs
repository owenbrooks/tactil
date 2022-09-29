use pyo3::prelude::*;
use std::collections::HashMap;

#[derive(Clone, Copy, Debug)]
#[pyclass]
pub struct Coord2D {
    #[pyo3(get, set)]
    pub x: f32,
    #[pyo3(get, set)]
    pub y: f32,
}
#[pymethods]
impl Coord2D {
    #[new]
    fn new(x: f32, y: f32) -> Self {
        Coord2D { x, y }
    }
}

#[derive(Debug, Copy, Clone)]
#[pyclass]
pub struct Vertex {
    #[pyo3(get, set)]
    pub id: usize,
    #[pyo3(get, set)]
    pub position: Coord2D,
}
#[pymethods]
impl Vertex {
    #[new]
    fn new(id: usize, position: Coord2D) -> Self {
        Vertex { id, position }
    }
}


#[derive(Debug, Copy, Clone)]
#[pyclass]
pub struct Edge {
    #[pyo3(get, set)]
    pub id: usize,
    #[pyo3(get, set)]
    pub vertex_id_a: usize,
    #[pyo3(get, set)]
    pub vertex_id_b: usize,
}
#[pymethods]
impl Edge {
    #[new]
    fn new(id: usize, vertex_id_a: usize, vertex_id_b: usize) -> Self {
        Edge { id, vertex_id_a, vertex_id_b }
    }
}

#[derive(Debug, Clone)]
#[pyclass]
pub struct VectorMap {
    #[pyo3(get, set)]
    pub vertices: HashMap<usize, Vertex>,
    #[pyo3(get, set)]
    pub edges: HashMap<usize, Edge>,
}
#[pymethods]
impl VectorMap {
    #[new]
    fn new(vertices: HashMap<usize, Vertex>, edges: HashMap<usize, Edge>) -> Self {
        VectorMap { vertices, edges }
    }
}

impl VectorMap {
    pub fn add_vertex(&mut self, position: &Coord2D) {
        let new_id = self.vertices.len() + self.edges.len() + 1;
        let new_vertex = Vertex {
            id: new_id,
            position: *position,
        };
        self.vertices.insert(new_id, new_vertex);
    }
    pub fn remove_vertex(&mut self, id: usize) {
        self.vertices.remove(&id);
    }
    pub fn add_edge(&mut self, vertex_id_a: usize, vertex_id_b: usize) {
        let new_id = self.vertices.len() + self.edges.len() + 1;

        if matches!(self.vertices.get(&vertex_id_a), None)
            || matches!(self.vertices.get(&vertex_id_b), None)
        {
            panic!("Attempt to add an edge between nodes that don't exist");
        }

        // Don't add an edge if it already exists
        if self.edge_exists(vertex_id_a, vertex_id_b) {
            return;
        }

        let new_edge = Edge {
            id: new_id,
            vertex_id_a,
            vertex_id_b,
        };
        self.edges.insert(new_id, new_edge);
    }
    pub fn edge_exists(&self, vertex_id_a: usize, vertex_id_b: usize) -> bool {
        if matches!(self.vertices.get(&vertex_id_a), None)
            || matches!(self.vertices.get(&vertex_id_b), None)
        {
            false
        } else {
            for (&_, &edge) in &self.edges {
                if edge.vertex_id_a == vertex_id_a && edge.vertex_id_b == vertex_id_b {
                    return true;
                }
            }
            false
        }
    }
    pub fn remove_edge(&mut self, id: usize) {
        self.edges.remove(&id);
    }
}

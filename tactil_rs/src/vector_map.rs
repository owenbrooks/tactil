use pyo3::prelude::*;
use std::collections::{HashMap, HashSet};

#[derive(FromPyObject, Clone, Copy, Debug)]
pub struct Coord2D {
    pub x: f32,
    pub y: f32,
}

#[derive(FromPyObject, Debug, Copy, Clone)]
pub struct Vertex {
    pub id: usize,
    pub position: Coord2D,
}

#[derive(FromPyObject, Debug, Copy, Clone)]
pub struct Edge {
    pub id: usize,
    pub vertex_id_a: usize,
    pub vertex_id_b: usize,
}

#[derive(FromPyObject, Debug, Clone)]
pub struct Label {
    pub id: usize,
    pub text: String,
    pub position: Coord2D,
    pub size: i32,
    pub is_braille: bool,
}

#[derive(FromPyObject, Debug, Clone)]
pub enum Feature {
    Label(Label),
    Vertex(Vertex),
    Edge(Edge),
}

#[derive(Debug, Clone)]
#[pyclass]
pub struct VectorMap {
    pub features: HashMap<usize, Feature>,
    pub vertices: HashSet<usize>,
    pub edges: HashSet<usize>,
    pub labels: HashSet<usize>,
}

impl VectorMap {
    pub fn add_vertex(&mut self, position: &Coord2D) {
        let new_id = self.features.len() + 1;
        let new_vertex = Feature::Vertex(Vertex {
            id: new_id,
            position: *position,
        });
        self.features.insert(new_id, new_vertex);
        self.vertices.insert(new_id);
    }
    pub fn remove_vertex(&mut self, id: usize) {
        self.vertices.remove(&id);
    }
    pub fn add_edge(&mut self, vertex_id_a: usize, vertex_id_b: usize) {
        let new_id = self.features.len() + 1;

        if !self.vertices.contains(&vertex_id_a) || !self.vertices.contains(&vertex_id_b) {
            panic!("Attempt to add an edge between nodes that don't exist");
        }

        // Don't add an edge if it already exists
        if self.edge_exists(vertex_id_a, vertex_id_b) {
            return;
        }

        let new_edge = Feature::Edge(Edge {
            id: new_id,
            vertex_id_a,
            vertex_id_b,
        });
        self.features.insert(new_id, new_edge);
        self.edges.insert(new_id);
    }
    pub fn edge_exists(&self, vertex_id_a: usize, vertex_id_b: usize) -> bool {
        if !self.vertices.contains(&vertex_id_a) || !self.vertices.contains(&vertex_id_b) {
            false
        } else {
            for &edge_id in &self.edges {
                if let Some(edge) = self.get_edge(edge_id) {
                    if edge.vertex_id_a == vertex_id_a && edge.vertex_id_b == vertex_id_b {
                        return true;
                    }
                }
            }
            false
        }
    }
    pub fn remove_edge(&mut self, id: usize) {
        self.edges.remove(&id);
    }

    pub fn get_edge(&self, id: usize) -> Option<Edge> {
        let feat = self.features.get(&id);
        if let Some(Feature::Edge(edge)) = feat {
            return Some(*edge);
        }
        None
    }

    pub fn get_vertex(&self, id: usize) -> Option<Vertex> {
        let feat = self.features.get(&id);
        if let Some(Feature::Vertex(vert)) = feat {
            return Some(*vert);
        }
        None
    }
}

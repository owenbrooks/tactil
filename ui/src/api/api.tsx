import { distance } from "../geometry";

export type ProcessReponse = {
    initial_vector_map: VectorMapPython,
    pcd_image_info: ImageInfo,
    message: string,
};

export type Dimensions = {
    width: number;
    height: number;
};

export type ImageInfo = {
    filename: string | undefined,
    world_dimensions: Dimensions, // height and width of the image in metres
    origin_camera: Coordinate, // world origin expressed in camera frame, metres (camera frame at center of image)
}

export type BoxProperties = {
    box_centers: Array<[number, number, number]>,
    box_extents: Array<[number, number, number]>,
    box_rotations: Array<[[number, number, number], [number, number, number], [number, number, number]]>,
};

export type LocationState = {
    boxProperties: BoxProperties,
};

export async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json();
};

export type Coordinate = {
    x: number,
    y: number,
};

export type Graph = {
    nodes: Map<number, Coordinate>,
    edges: Map<number, [number, number]>,
    labels: Label[],
};

export enum Alphabet {
    Regular = "REGULAR",
    Braille = "BRAILLE",
}

export type Label = {
    id: number,
    text: string,
    coord: Coordinate,
    size: number, // TODO: decide what this represents
    alphabet: Alphabet
};

export const PIXEL_TO_WORLD_FACTOR = 0.1;

type Feature = Vertex | Edge | Label;

type VectorMapPython = {
    features: Record<number, Feature>,
    vertices: number[],
    edges: number[],
    labels: number[],
}

export type VectorMap = {
    features: Map<number, Feature>,
    vertices: number[],
    edges: number[],
    labels: number[],
};

type Vertex = {
    id: number,
    position: Coordinate,
}
type Edge = {
    id: number,
    vertex_id_a: number,
    vertex_id_b: number
}

export function vectorMapToGraph(vectorMap: VectorMap | undefined): Graph {
    if (vectorMap === undefined) {
        return {
            nodes: new Map(),
            edges: new Map(),
            labels: [],
        }
    }

    const nodes: Map<number, Coordinate> = new Map();
    const edges: Map<number, [number, number]> = new Map();
    const labels: Label[] = [];

    vectorMap.vertices.forEach((id) => {
        nodes.set(id, (vectorMap.features.get(id) as Vertex).position);
    });
    vectorMap.edges.forEach((id) => {
        const edge = (vectorMap.features.get(id) as Edge);
        edges.set(id, [edge.vertex_id_a, edge.vertex_id_b]);
    });

    return {
        nodes,
        edges,
        labels,
    };
}

export function boxParamsToGraph(boxProperties: BoxProperties | undefined): Graph {
    if (boxProperties === undefined) {
        return {
            nodes: new Map(),
            edges: new Map(),
            labels: [],
        }
    }

    const apply_z_rot = (point: [number, number], angle_rad: number): Coordinate => {
        const cos_theta = Math.cos(angle_rad);
        const sin_theta = Math.sin(angle_rad);
        const x = point[0] * cos_theta + point[1] * sin_theta;
        const y = point[0] * sin_theta - point[1] * cos_theta;
        return {
            x: x,
            y: y,
        }
    }

    const apply_translation = (coord: Coordinate, translation: Coordinate) => {
        return {
            x: coord.x + translation.x,
            y: coord.y + translation.y,
        }
    }

    const nodes: Map<number, Coordinate> = new Map();
    const edges: Map<number, [number, number]> = new Map();

    for (let box in boxProperties.box_centers) {
        const center = boxProperties.box_centers[box];
        const extent = boxProperties.box_extents[box];
        const rotation = boxProperties.box_rotations[box];

        const z_rot_euler = Math.atan2(rotation[1][0], rotation[0][0]);
        const x_coord = extent[0] / 2
        const x_coord_pos = Math.max(x_coord, 0)
        const x_coord_neg = Math.min(-x_coord, 0)

        const nodeAAtOrigin = apply_z_rot([x_coord_neg, 0], z_rot_euler);
        const nodeBAtOrigin = apply_z_rot([x_coord_pos, 0], z_rot_euler);
        const centre = {
            x: center[0],
            y: center[1],
        }
        const nodeA = apply_translation(nodeAAtOrigin, centre);
        const nodeB = apply_translation(nodeBAtOrigin, centre);

        const indexA = nodes.size;
        const indexB = indexA + 1;
        nodes.set(indexA, nodeA);
        nodes.set(indexB, nodeB);

        // Create a new edge with id bigger than any existing edges
        let maxEdgeId = -1;
        if (edges.size > 0) {
            maxEdgeId = [...edges.keys()].reduce((a, e) => e > a ? e : a); // find maximum edgeId in the map
        }
        edges.set(maxEdgeId + 1, [indexA, indexB]);
    }

    return {
        nodes: nodes,
        edges: edges,
        labels: [],
    }
}

export function deserializeVectorMap(response: ProcessReponse): VectorMap {
    const apiVectorMap = response.initial_vector_map;

    const vectorMap: VectorMap = {
        features: new Map(),
        vertices: apiVectorMap.vertices,
        edges: apiVectorMap.edges,
        labels: apiVectorMap.labels,
    };

    // Convert features Record to Map
    for (let entryId in apiVectorMap.features) {
        const id = parseInt(entryId);
        vectorMap.features.set(id, apiVectorMap.features[id]);
    }

    return vectorMap;
}

export function serializeVectorMap(vectorMap: VectorMap): VectorMapPython {
    const vectorMapSerialized: VectorMapPython = {
        features: {},
        vertices: vectorMap.vertices,
        edges: vectorMap.edges,
        labels: vectorMap.labels,
    };

    // Convert features Map to Record
    vectorMap.features.forEach((feature) => {
        vectorMapSerialized.features[feature.id] = feature;
    });

    return vectorMapSerialized;
}

export function graphToVectorMap(graph: Graph | undefined): VectorMap {
    const vectorMap: VectorMap = {
        features: new Map(),
        vertices: [],
        edges: [],
        labels: [],
    };
    if (graph === undefined) {
        return vectorMap;
    }

    graph.nodes.forEach((position, id) => {
        const vertex: Vertex = {
            id,
            position,
        };
        vectorMap.features.set(id, vertex);
        vectorMap.vertices.push(id);
    });

    graph.edges.forEach(([nodeIdA, nodeIdB], edgeId) => {
        const edge: Edge = {
            id: edgeId,
            vertex_id_a: nodeIdA,
            vertex_id_b: nodeIdB,
        };
        vectorMap.features.set(edgeId, edge);
        vectorMap.edges.push(edge.id);
    });

    graph.labels.forEach((label) => {
        vectorMap.features.set(label.id, label);
        vectorMap.labels.push(label.id);
    });

    return vectorMap;
}

export function graphToBoxParams(graph: Graph | undefined): BoxProperties {
    if (graph === undefined) {
        return {
            box_centers: [],
            box_extents: [],
            box_rotations: [],
        };
    }

    let box_centers: Array<[number, number, number]> = [];
    let box_extents: Array<[number, number, number]> = [];
    let box_rotations: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [];

    graph.edges.forEach((edge) => {
        let nodeA = graph.nodes.get(edge[0]);
        let nodeB = graph.nodes.get(edge[1]);
        if (nodeA === undefined || nodeB === undefined) {
            return; // exits loop early
        }
        const average: [number, number, number] = [
            (nodeA.x + nodeB.x) / 2,
            (nodeA.y + nodeB.y) / 2,
            0,
        ];
        box_centers.push(average);

        const length = distance(nodeA, nodeB);
        const height = 1; // m
        const thickness = 0.1 // m
        box_extents.push([length, thickness, height]);

        const zAngleRad = Math.atan2((nodeB.y - nodeA.y), (nodeB.x - nodeA.x));
        const cosTheta = Math.cos(zAngleRad);
        const sinTheta = Math.sin(zAngleRad);
        const rotMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
            [cosTheta, -sinTheta, 0],
            [sinTheta, cosTheta, 0],
            [0, 0, 1]
        ];
        box_rotations.push(rotMatrix);
    });

    return {
        box_centers: box_centers as [number, number, number][],
        box_extents: box_extents as [number, number, number][],
        box_rotations: box_rotations as [[number, number, number], [number, number, number], [number, number, number]][],
    }
}

import { distance } from "../geometry";

export type ProcessReponse = {
    box_outputs: BoxProperties,
    pcd_image_info: ImageInfo,
    message: string,
};

export type Dimensions = {
    width: number;
    height: number;
};

export type ImageInfo = {
    path: string | undefined,
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

export type Label = {
    text: string,
    coord: Coordinate,
};

export const PIXEL_TO_WORLD_FACTOR = 0.1;

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

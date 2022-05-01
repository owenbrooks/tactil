
export type ProcessReponse = {
    box_outputs: BoxProperties
    message: string,
};

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

type Graph = {
    nodes: Record<number, Coordinate>,
    edges: Record<number, [number, number]>,
};

export const PIXEL_TO_WORLD_FACTOR = 0.1;

export function boxParamsToGraph(boxProperties: BoxProperties | undefined): Graph {
    if (boxProperties === undefined) {
        return {
            nodes: {},
            edges: {}
        }
    }

    const apply_z_rot = (point: [number, number], angle_rad: number): Coordinate => {
        const cos_theta = Math.cos(angle_rad);
        const sin_theta = Math.sin(angle_rad);
        const x = point[0]*cos_theta + point[1]*sin_theta;
        const y = point[0]*sin_theta - point[1]*cos_theta;
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

    const nodes: Record<number, Coordinate> = {}
    const edges: Record<number, [number, number]> = {};

    for (let box in boxProperties.box_centers) {
        const center = boxProperties.box_centers[box];
        const extent = boxProperties.box_extents[box];
        const rotation = boxProperties.box_rotations[box];

        const z_rot_euler = Math.atan2(rotation[1][0], rotation[0][0]);
        const x_coord = extent[0]/2
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
        
        const indexA = Object.keys(nodes).length;
        const indexB = indexA + 1;
        nodes[indexA] = nodeA;
        nodes[indexB] = nodeB;
        edges[Object.keys(edges).length] = [indexA, indexB];
    }

    return {
        nodes: nodes,
        edges: edges,
    }
}

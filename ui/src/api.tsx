
export type ProcessReponse = {
    box_outputs: BoxProperties
    message: string,
};

export type BoxProperties = {
    box_centers: Array<[number, number, number]>,
    box_extents: Array<[number, number, number]>,
    box_rotations: Array<[number, number, number]>,
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

export function boxParamsToGraph(boxProperties: BoxProperties | undefined): Graph {
    // if (boxProperties === undefined) {
    //     return {
    //         nodes: {},
    //         edges: {}
    //     }
    // }

    // for (let box in boxProperties.box_centers) {
    //     const centers = boxProperties.box_centers[box];
    //     const extents = boxProperties.box_extents[box];
    //     const rotations = boxProperties.box_rotations[box];
    // }
    // console.log(boxProperties)
    const defaultNodes: Record<number, Coordinate> = { 0: { x: 0.0, y: 0.0 }, 1: { x: 10.0, y: 10.0 }, 2: { x: -5, y: -8 }, 3: { x: -10, y: 5 } };
    const defaultEdges: Record<number, [number, number]> = { 0: [0, 1], 1: [0, 2], 2: [2, 3] };

    return {
        nodes: defaultNodes,
        edges: defaultEdges,
    }
}

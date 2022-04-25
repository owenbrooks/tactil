
export type ProcessReponse = {
    box_outputs: BoxOutputs
    message: string,
}

export type BoxOutputs = {
    box_centers: Array<[number, number, number]>,
    box_extents: Array<[number, number, number]>,
    box_totations: Array<[number, number, number]>,
}

export type LocationState = {
    box_outputs: BoxOutputs,
}

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
}

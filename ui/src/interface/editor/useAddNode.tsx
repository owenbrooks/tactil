import { useState } from "react";
import { Coordinate, Graph } from "../../api/api";
import { pixelToWorld } from "../../geometry";
import { EditorMode, ViewState } from "./Edit";


export default function useAddNode(mousePos: Coordinate, editorMode: EditorMode,
    graph: Graph,
    setGraph: React.Dispatch<React.SetStateAction<Graph>>,
    viewState: ViewState,
) {
    const [prevNodeId, setPrevNodeId] = useState<number | undefined>();
    const [unplacedId, setUnplacedId] = useState(Math.max(...graph.nodes.keys()) + 1);

    function handleClick() {
        // add node to the graph permanently by incrementing unplacedId
        // setNodes(nodes);
        // setEdges(edges);
    }

    if (editorMode === EditorMode.Add) {
        const newNodeCoord = pixelToWorld(mousePos, viewState.panOffset, viewState.zoomLevel)
        return { unplacedId, unplacedCoord: newNodeCoord, handleClickAddNode: handleClick }
    }

    return { unplacedId: null, unplacedCoord: null, handleClickAddNode: handleClick };
}

export function concatUnplaced(
    graph: Graph,
    unplacedId: number | null,
    unplacedCoord: Coordinate | null,
    editorMode: EditorMode,
) {
    const nodesWithUnplaced = new Map(graph.nodes);
    if (unplacedId !== null && unplacedCoord !== null && editorMode === EditorMode.Add) {
        nodesWithUnplaced.set(unplacedId, unplacedCoord);
    }
    const edgesWithUnplaced = new Map(graph.edges);
    return { nodes: nodesWithUnplaced, edges: edgesWithUnplaced };
}
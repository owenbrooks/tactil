import { useState } from "react";
import { Coordinate, Graph } from "../../api/api";
import { pixelToWorld } from "../../geometry";
import { EditorMode, ViewState } from "./Edit";

// TODO: make escape and editmode switching reset the prev added node
export default function useAddNode(
    mousePos: Coordinate,
    editorMode: EditorMode,
    graph: Graph,
    setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void,
    viewState: ViewState,
    hoveredNodes: number[],
) {
    const [prevNodeId, setPrevNodeId] = useState<number | undefined>();
    const unplacedId = Math.max(0, Math.max(...graph.nodes.keys()) + 1);
    const unplacedCoord = pixelToWorld(mousePos, viewState.panOffset, viewState.zoomLevel);

    function resetPreviousAddition() {
        setPrevNodeId(undefined);
    }

    function handleClickAddNode() {
        if (editorMode !== EditorMode.Add) {
            return;
        }
        // if not hovering any, add current pos to nodes set and set prev placed to this new one
        // if no nodes were previously placed, and hovering one, set prev placed to the hovered one
        // if node was previously placed, and hovering one, create edge between the two and set prev placed to hovered one
        if (hoveredNodes.length === 0) {

            const newNodes = new Map(graph.nodes);
            newNodes.set(unplacedId, unplacedCoord);

            const newEdges = new Map(graph.edges);
            if (prevNodeId !== undefined) {
                // add edge if previously placed
                const maxEdgeId = Math.max(0, Math.max(...graph.edges.keys()) + 1);
                newEdges.set(maxEdgeId, [unplacedId, prevNodeId]);
            }

            const newGraph = { nodes: newNodes, edges: newEdges };
            setGraph(newGraph);
            setPrevNodeId(unplacedId);
        } else if (hoveredNodes.length === 1) {
            const hovered = hoveredNodes[0]
            if (prevNodeId !== undefined) {
                // add edge between prev and hovered
                const newEdges = new Map(graph.edges);
                const maxEdgeId = Math.max(0, Math.max(...graph.edges.keys()) + 1);
                newEdges.set(maxEdgeId, [hovered, prevNodeId]);
                const newGraph = { nodes: graph.nodes, edges: newEdges };
                setGraph(newGraph);
            }
            setPrevNodeId(hovered);
        }
    }

    // Add unplaced node and edge to graph if necessary
    const nodesWithUnplaced = new Map(graph.nodes);
    if (unplacedId !== null && unplacedCoord !== null && editorMode === EditorMode.Add) {
        nodesWithUnplaced.set(unplacedId, unplacedCoord);
    }
    // add edge between unplaced and prev placed if exists
    const edgesWithUnplaced = new Map(graph.edges);
    if (prevNodeId !== undefined && editorMode === EditorMode.Add) {
        const maxEdgeId = Math.max(...graph.edges.keys()) + 1;
        edgesWithUnplaced.set(maxEdgeId, [unplacedId, prevNodeId]);
    }
    const graphWithUnplaced = { nodes: nodesWithUnplaced, edges: edgesWithUnplaced };

    const extendingEdge = prevNodeId !== undefined; // indicates whether a node was just created/selected for extensions

    if (editorMode === EditorMode.Add) {
        const newNodeCoord = pixelToWorld(mousePos, viewState.panOffset, viewState.zoomLevel)
        return { unplacedId, unplacedCoord: newNodeCoord, handleClickAddNode, graphWithUnplaced, resetPreviousAddition, extendingEdge };
    } else {
        return { unplacedId: null, unplacedCoord: null, handleClickAddNode, graphWithUnplaced, resetPreviousAddition, extendingEdge };
    }
}

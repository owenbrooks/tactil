import { useState } from "react";
import { Graph } from "../../api/api";
import { EditorMode } from "./Edit";

export function useSelected(hoveredNodes: number[], graph: Graph, setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void, editorMode: EditorMode) {
    const [selectedNodes, setSelectedNodes] = useState<number[]>([]); // these numbers are keys to the nodes map
    const [shiftHeld, setShiftHeld] = useState(false);

    function selectionHandleKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Shift') { // shift must be held for selection of more than one node
            setShiftHeld(e.type === 'keydown')
        } else if (e.key === 'Delete' && e.type === 'keydown') {
            deleteSelectedNodes();
        }
    }

    function deselectAll() {
        setSelectedNodes([]);
    }

    // select nodes on mousedown
    function selectionHandleClick(isDragging: boolean) {
        if (!isDragging && editorMode !== EditorMode.Add) {
            setSelectedNodes(prevSelected => {
                const isAlreadySelected = hoveredNodes.some(nodeId => {
                    return prevSelected.indexOf(nodeId) >= 0;
                });
                if (isAlreadySelected) { // Don't change selection
                    return prevSelected;
                }
                if (shiftHeld) { // Add newly clicked nodes to selection
                    const newSelected = prevSelected.concat(hoveredNodes);
                    return newSelected;
                } else { // if shift isn't held, change selection to only currently hovered nodes
                    return hoveredNodes;
                }
            });
        }
    }

    function deleteSelectedNodes() {
        // Remove selected nodes
        // copy old graph
        const newGraph = {
            nodes: new Map(graph.nodes),
            edges: new Map(graph.edges),
        };
        // Deselect hovered nodes if any were previously selected and shift is held down
        selectedNodes.forEach(nodeId => {
            newGraph.nodes.delete(nodeId) // delete node itself
            // Delete associated edges
            for (let [edgeId, edge] of graph.edges) {
                if (nodeId === edge[0] || nodeId === edge[1]) {
                    newGraph.edges.delete(edgeId);
                }
            }
        });
        setGraph(newGraph);
    }

    return { selectedNodes, deselectAll, selectionHandleKeyPress, selectionHandleClick, deleteSelectedNodes };
}
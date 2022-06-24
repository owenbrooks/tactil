import { useState } from "react";
import { Coordinate, Graph } from "../../api/api";
import { distance, pixelToWorld, worldToPixel } from "../../geometry";
import { EditorMode, ViewState } from "./Edit";

export function findHoveredIds(mousePos: Coordinate, viewState: ViewState, graph: Graph, nodeRadiusPx: number): number[] {
    const hoveredNodes = [...graph.nodes.entries()].filter(([_, node]) => {
        const pixelCoord = worldToPixel(node, viewState.panOffset, viewState.zoomLevel);
        return distance(mousePos, pixelCoord) < nodeRadiusPx;
    });
    const ids = hoveredNodes.map(([id, _]) => id);
    return ids;
}

export default function useDrag(
    graph: Graph,
    setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void,
    mousePos: Coordinate,
    viewState: ViewState,
    hoveredNodes: number[],
    selectedNodes: number[],
    deselectAll: () => void,
    editorMode: EditorMode,
) {
    const [dragStartPosWorld, setDragStartPosWorld] = useState<Coordinate | null>(null);
    const isDragging = dragStartPosWorld !== null;

    const mousePosWorld = pixelToWorld(mousePos, viewState.panOffset, viewState.zoomLevel);

    const liveDragOffsetWorld = (() => {
        if (dragStartPosWorld !== null) {
            return {
                x: mousePosWorld.x - dragStartPosWorld.x,
                y: mousePosWorld.y - dragStartPosWorld.y
            };
        } else {
            return null;
        }
    })();

    // add drag offset to relevant nodes
    const nodesWithDragOffset = new Map(graph.nodes);
    if (dragStartPosWorld !== null && liveDragOffsetWorld !== null && editorMode === EditorMode.Edit) {
        selectedNodes.forEach((nodeId) => {
            const node = graph.nodes.get(nodeId);
            if (node === undefined) {
                console.error("Graph and selected nodes mismatch.");
            } else {
                const newCoord = {
                    x: node.x + liveDragOffsetWorld.x,
                    y: node.y + liveDragOffsetWorld.y,
                }
                nodesWithDragOffset.set(nodeId, newCoord);
            }
        });
    }
    const graphWithDragOffset = { nodes: nodesWithDragOffset, edges: graph.edges };


    function stopDragging() {
        const isDragging = dragStartPosWorld !== null;
        if (isDragging) {
            setGraph(graphWithDragOffset);
        }
        setDragStartPosWorld(null);
    }

    function dragHandleMouseDown(e: React.MouseEvent) {
        // Only do this for primary click
        if (e.button === 0) {
            // Start panning if no nodes are hovered   
            if (hoveredNodes.length === 0) {
                // reset selected nodes
                deselectAll();
            }
            // If nodes are hovered, and they have been selected, start dragging
            const hoveredNodeAlreadySelected = hoveredNodes.some((nodeId) => selectedNodes.indexOf(nodeId) >= 0);
            if (hoveredNodeAlreadySelected) {
                setDragStartPosWorld(mousePosWorld); // start dragging
            }
        }
    }
    function dragHandleMouseUp(e: React.MouseEvent) {
        // Only work for primary button
        if (e.button === 0) {
            if (isDragging) {
                stopDragging();
                // Merge hovered nodes with dragged node
                mergeDraggedWithHovered();
            }
        }
    }

    function mergeDraggedWithHovered() {
        // If one node is dragged on top of another node and released, they get merged into a single node
        // This only applies when a single node is being moved
        if (dragStartPosWorld !== null) { // check that node is actually being dragged
            if (selectedNodes.length === 1) {
                const otherHoveredNodes = hoveredNodes.filter(id => id !== selectedNodes[0]);
                if (otherHoveredNodes.length === 1 && selectedNodes[0] !== otherHoveredNodes[0]) {
                    const selectedId = selectedNodes[0]; // node being dragged (gets deleted)
                    // copy old graph
                    const newGraph = {
                        nodes: new Map(graph.nodes),
                        edges: new Map(graph.edges),
                    };
                    newGraph.nodes.delete(selectedId);
                    // update edges
                    const hoveredId = otherHoveredNodes[0]; // node being hovered (acquires new edges)
                    graph.edges.forEach((edge, edgeId) => {
                        const selectedA = selectedId === edge[0];
                        const selectedB = selectedId === edge[1];

                        const remainingEdgeId = selectedA ? edge[1] : edge[0];
                        if (selectedA || selectedB) {
                            if (remainingEdgeId === hoveredId) {
                                newGraph.edges.delete(edgeId) // edge is collapsed, delete it
                            }
                            else { // update edge with new id
                                if (selectedA) {
                                    newGraph.edges.set(edgeId, [hoveredId, remainingEdgeId]);
                                } else if (selectedB) {
                                    newGraph.edges.set(edgeId, [remainingEdgeId, hoveredId]);
                                }
                            }
                        }
                    });
                    setGraph(newGraph);
                }
            }
        }
    }

    return {
        isDragging,
        mergeDraggedWithHovered,
        cancelDragging: stopDragging,
        dragHandleMouseUp,
        dragHandleMouseDown,
        graphWithDragOffset,
    }
}
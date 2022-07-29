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

export function useDrag(mousePos: Coordinate, viewState: ViewState) {
    const [dragStartPosWorld, setDragStartPosWorld] = useState<Coordinate | null>(null);
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
    const isDragging = liveDragOffsetWorld !== null && (liveDragOffsetWorld.x !== 0 || liveDragOffsetWorld.y !== 0);
    function startDragging() {
        setDragStartPosWorld(mousePosWorld); // start dragging
    }

    function stopDragging() {
        setDragStartPosWorld(null);
    }

    return { liveDragOffsetWorld, isDragging, startDragging, stopDragging };
}

export function useDragGraph(
    graph: Graph,
    setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void,
    mousePos: Coordinate,
    viewState: ViewState,
    hoveredNodes: number[],
    selectedNodes: number[],
    deselectAll: () => void,
    editorMode: EditorMode,
) {
    const { liveDragOffsetWorld, isDragging, startDragging, stopDragging } = useDrag(mousePos, viewState);

    // add drag offset to relevant nodes
    const nodesWithDragOffset = new Map(graph.nodes);
    if (liveDragOffsetWorld !== null && editorMode === EditorMode.Edit) {
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
    const graphWithDragOffset = { nodes: nodesWithDragOffset, edges: graph.edges, labels: [...graph.labels] };


    function stopDraggingGraph() {
        if (isDragging) {
            const afterHoveredDraggedMerge = mergeDraggedWithHovered(graphWithDragOffset, hoveredNodes, selectedNodes);
            setGraph(afterHoveredDraggedMerge);
        }
        stopDragging();
    }

    function dragGraphHandleMouseDown(e: React.MouseEvent) {
        // Only do this for primary click
        if (e.button === 0) {
            // Start panning if no nodes are hovered   
            if (hoveredNodes.length === 0) {
                // reset selected nodes
                deselectAll();
            } else {
                startDragging();
            }
        }
    }
    function dragGraphHandleMouseUp(e: React.MouseEvent) {
        // Only work for primary button
        if (e.button === 0) {
            stopDraggingGraph();
        }
    }

    return {
        isDragging,
        cancelDraggingGraph: stopDraggingGraph,
        dragGraphHandleMouseUp,
        dragGraphHandleMouseDown,
        graphWithDragOffset,
    }
}

// If one node is dragged on top of another node and released, they get merged into a single node
// This only applies when a single node is being moved
function mergeDraggedWithHovered(graphWithDragOffset: Graph, hoveredNodes: number[], selectedNodes: number[]) {
    // copy old graph
    const newGraph = {
        nodes: new Map(graphWithDragOffset.nodes),
        edges: new Map(graphWithDragOffset.edges),
        labels: [...graphWithDragOffset.labels],
    };
    if (selectedNodes.length === 1) {
        const otherHoveredNodes = hoveredNodes.filter(id => id !== selectedNodes[0]);
        if (otherHoveredNodes.length === 1 && selectedNodes[0] !== otherHoveredNodes[0]) {
            const selectedId = selectedNodes[0]; // node being dragged (gets deleted)
            newGraph.nodes.delete(selectedId);
            // update edges
            const hoveredId = otherHoveredNodes[0]; // node being hovered (acquires new edges)
            graphWithDragOffset.edges.forEach((edge, edgeId) => {
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
        }
    }
    return newGraph;
}
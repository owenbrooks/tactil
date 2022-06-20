import { useState } from "react";
import { Coordinate, Graph } from "../../api/api";
import { distance, pixelToWorld, worldToPixel } from "../../geometry";
import { ViewState } from "./Edit";

export default function useMouseControl(
    graphWithUnplaced: Graph,
    setGraph: React.Dispatch<React.SetStateAction<Graph>>,
    unplacedId: number | null,
    mousePos: Coordinate,
    viewState: ViewState,
    shiftHeld: boolean,
    nodeRadiusPx: number,
) {
    const [selectedNodes, setSelectedNodes] = useState<number[]>([]); // these numbers are keys to the nodes map
    const [dragStartPosWorld, setDragStartPosWorld] = useState<Coordinate | null>(null)

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
    let nodesWithDragOffset: Map<number, Coordinate> = new Map();
    graphWithUnplaced.nodes.forEach((node, nodeId) => {
        if (selectedNodes.indexOf(nodeId) >= 0 && liveDragOffsetWorld != null && nodeId !== unplacedId) {
            // Add drag offset to selected nodes
            nodesWithDragOffset.set(nodeId, {
                x: node.x + liveDragOffsetWorld.x,
                y: node.y + liveDragOffsetWorld.y,
            });
        } else {
            nodesWithDragOffset.set(nodeId, node);
        }
    });

    // Find nodes under the mouse cursor
    const hoveredNodes = [...nodesWithDragOffset.keys()].filter((nodeId) => {
        const node = nodesWithDragOffset.get(nodeId);
        if (node === undefined) {
            return false; // early return if value somehow not present
        }
        const pixelCoord = worldToPixel(node, viewState.panOffset, viewState.zoomLevel);
        return distance(mousePos, pixelCoord) < nodeRadiusPx;
    });
    const hoveredNodesWithUnplaced = unplacedId ? [...hoveredNodes, unplacedId] : hoveredNodes; // append unplaced if exists

    function handleMouseDown(e: React.MouseEvent) {
        // Only do this for primary click
        if (e.button === 0) {
            // Start panning if no nodes are hovered   
            if (hoveredNodes.length === 0) {
                // reset selected nodes
                setSelectedNodes([]);
            }
            // If nodes are hovered, and they have been selected, start dragging
            const hoveredNodeAlreadySelected = hoveredNodes.some((nodeId) => selectedNodes.indexOf(nodeId) >= 0);
            if (hoveredNodeAlreadySelected) {
                setDragStartPosWorld(mousePosWorld); // start dragging
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
                    setGraph(prevGraph => {
                        // copy old graph
                        const newGraph = {
                            nodes: new Map(prevGraph.nodes),
                            edges: new Map(prevGraph.edges),
                        };
                        // delected moving node
                        newGraph.nodes.delete(selectedId);
                        // update edges
                        const hoveredId = otherHoveredNodes[0]; // node being hovered (acquires new edges)
                        prevGraph.edges.forEach((edge, edgeId) => {
                            if (edge[0] === selectedId) {
                                newGraph.edges.set(edgeId, [hoveredId, edge[1]]);
                            } else if (edge[1] === selectedId) {
                                newGraph.edges.set(edgeId, [edge[0], hoveredId]);
                            }
                        });

                        return newGraph;
                    })
                }
            }
        }
    }
    function handleMouseUp(e: React.MouseEvent) {
        // Only work for primary button
        if (e.button === 0) {
            if (liveDragOffsetWorld === null || (liveDragOffsetWorld.x === 0 && liveDragOffsetWorld.y === 0)) { // only if weren't previously dragging
                setSelectedNodes(prevSelected => {
                    const isAlreadySelected = hoveredNodes.some(nodeId => {
                        return prevSelected.indexOf(nodeId) >= 0;
                    });
                    // Deselect hovered nodes if any were previously selected and shift is held down
                    if (shiftHeld) {
                        // Remove clicked nodes if they were already selected
                        if (isAlreadySelected) {
                            const newSelected = prevSelected.filter(nodeId => {
                                return hoveredNodes.indexOf(nodeId) < 0;
                            });
                            return newSelected;
                        } else { // Otherwise add them to selection
                            const newSelected = prevSelected.concat(hoveredNodes);
                            return newSelected;
                        }
                    } else { // if shift isn't held, change selection to only currently hovered nodes
                        return hoveredNodes;
                    }
                });
            }

            stopDragging();

            // Merge hovered nodes with dragged node
            mergeDraggedWithHovered();
        }
    }
    function stopDragging() {
        setGraph({
            nodes: nodesWithDragOffset,
            edges: graphWithUnplaced.edges,
        })
        setDragStartPosWorld(null);
    }

    function deleteSelectedNodes() {
        // Remove selected nodes
        setGraph((prevGraph) => {
            // copy old graph
            const newGraph = {
                nodes: new Map(prevGraph.nodes),
                edges: new Map(prevGraph.edges),
            };
            // Deselect hovered nodes if any were previously selected and shift is held down
            selectedNodes.forEach(nodeId => {
                newGraph.nodes.delete(nodeId) // delete node itself
                // Delete associated edges
                for (let [edgeId, edge] of prevGraph.edges) {
                    if (nodeId === edge[0] || nodeId === edge[1]) {
                        newGraph.edges.delete(edgeId);
                    }
                }
            });
            return newGraph;
        });
    }

    return {
        selectedNodes,
        mergeDraggedWithHovered,
        deleteSelectedNodes,
        stopDragging,
        handleMouseUp,
        handleMouseDown,
        hoveredNodesWithUnplaced,
        nodesWithDragOffset,
    }
}
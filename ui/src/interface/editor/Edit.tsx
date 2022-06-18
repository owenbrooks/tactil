import React, { useState, useRef, useEffect } from 'react';
import { BoxProperties, Coordinate, boxParamsToGraph, PIXEL_TO_WORLD_FACTOR, graphToBoxParams, ImageInfo } from '../../api/api';
import ScaleBar from '../ScaleBar';
import { distance } from '../../geometry';
import './Edit.css'
import useZoom from './useZoom';
import usePan from './usePan';
import { Dimensions } from "../../api/api";

type EditProps = {
  boxProperties: BoxProperties | undefined,
  setBoxProperties: React.Dispatch<React.SetStateAction<BoxProperties | undefined>>,
  pcdImageInfo: ImageInfo | undefined,
};

const NODE_RADIUS_PX = 13 / 2;

function pixelToWorld(pixelCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
  const x = PIXEL_TO_WORLD_FACTOR * (pixelCoord.x - pixelOffset.x) / zoomLevel;
  const y = PIXEL_TO_WORLD_FACTOR * (pixelCoord.y - pixelOffset.x) / zoomLevel;

  return {
    x: x,
    y: y,
  }
}

function worldToPixel(worldCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
  const x = worldCoord.x * zoomLevel / PIXEL_TO_WORLD_FACTOR + pixelOffset.x * zoomLevel;
  const y = worldCoord.y * zoomLevel / PIXEL_TO_WORLD_FACTOR + pixelOffset.y * zoomLevel;
  return {
    x: x,
    y: -y, // negative y since pixel coordinate system is reversed
  }
}

function Edit(props: EditProps) {

  const initialGraph = boxParamsToGraph(props.boxProperties);
  const [nodes, setNodes] = useState<Map<number, Coordinate>>(initialGraph.nodes);
  const [edges, setEdges] = useState<Map<number, [number, number]>>(initialGraph.edges);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]); // these numbers are keys to the nodes map
  const [pcdImageDimensions, setPcdImageDimensions] = useState<Dimensions>({ height: 0, width: 0 });

  // Keyboard state
  const [shiftHeld, setShiftHeld] = useState(false);

  // Zooming, panning and mouse variables
  const editDivRef = useRef<HTMLDivElement>(null); // used to enable and disable zoom controls / scrolling
  const defaultZoom = 1.0;
  const minZoom = 0.1;
  const maxZoom = 50;
  const [zoomLevel, startZoomListen, stopZoomListen, resetZoomLevel] = useZoom(defaultZoom, maxZoom, minZoom, editDivRef);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPosWorld, setDragStartPosWorld] = useState<Coordinate | null>(null)
  const [combinedPanOffset, startPanning, stopPanning, panHandleMouseMove, resetPanOffset] = usePan(zoomLevel, mousePos);

  // Update graph when nodes or edges are changed
  const { setBoxProperties } = props;
  useEffect(() => {
    const newGraph = {
      nodes: nodes,
      edges: edges
    };
    const newBoxProperties = graphToBoxParams(newGraph);
    setBoxProperties(newBoxProperties);
  }, [nodes, edges, setBoxProperties])

  // Do calculations for dragging
  const mousePosWorld = pixelToWorld(mousePos, combinedPanOffset, zoomLevel);
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
  nodes.forEach((node, nodeId) => {
    if (selectedNodes.indexOf(nodeId) >= 0 && liveDragOffsetWorld != null) {
      // Add drag offset if necessary
      nodesWithDragOffset.set(nodeId, {
        x: node.x + liveDragOffsetWorld.x,
        y: node.y + -liveDragOffsetWorld.y,
      });
    } else {
      nodesWithDragOffset.set(nodeId, node);
    }
  });

  // Find nodes under the mouse cursor
  const hoveredNodes = [...nodesWithDragOffset.keys()].filter((nodeId) => {
    const node = nodesWithDragOffset.get(nodeId);
    if (node == undefined) {
      return false; // early return if value somehow not present
    }
    const pixelCoord = worldToPixel(node, combinedPanOffset, zoomLevel);
    return distance(mousePos, pixelCoord) < NODE_RADIUS_PX;;
  });

  // Zooming, panning and mouse controls
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const editFrameElem = document.getElementById('edit-frame');
    if (editFrameElem != null) {
      const pixelCoord = {
        x: e.nativeEvent.offsetX - editFrameElem.clientWidth / 2,
        y: e.nativeEvent.offsetY - editFrameElem.clientHeight / 2,
      }
      setMousePos(pixelCoord);
      panHandleMouseMove(pixelCoord);
    }
  }
  function handleMouseDown(e: React.MouseEvent) {
    // Only do this for primary click
    if (e.button === 0) {
      // Start panning if no nodes are hovered   
      if (hoveredNodes.length === 0) {
        // start panning
        startPanning();

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
          setNodes(prevNodes => {
            const newNodes = new Map(prevNodes);
            newNodes.delete(selectedId);
            return newNodes;
          })
          setEdges(prevEdges => {
            const hoveredId = otherHoveredNodes[0]; // node being hovered (acquires new edges)
            const newEdges = new Map(prevEdges);
            prevEdges.forEach((edge, edgeId) => {
              if (edge[0] === selectedId) {
                newEdges.set(edgeId, [hoveredId, edge[1]]);
              } else if (edge[1] === selectedId) {
                newEdges.set(edgeId, [edge[0], hoveredId]);
              }
            });
            return newEdges;
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

      // Finish and apply panning and dragging
      stopPanning();
      stopDragging();

      // Merge hovered nodes with dragged node
      mergeDraggedWithHovered();
    }
  }
  function stopDragging() {
    setNodes(nodesWithDragOffset);
    setDragStartPosWorld(null);
  }

  // When the mouse exits the editing box, stop panning/dragging and allow scrolling again
  function handleMouseLeave() {
    stopPanning();
    stopDragging();
    stopZoomListen();
  }
  function handleMouseEnter() {
    startZoomListen();
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Shift') { // shift must be held for selection of more than one node
      setShiftHeld(e.type === 'keydown')
    } else if (e.key === 'Delete') {
      // Remove selected nodes
      setNodes(prevNodes => {
        // Deselect hovered nodes if any were previously selected and shift is held down
        const newNodes = new Map(prevNodes);
        selectedNodes.forEach(nodeId => {
          newNodes.delete(nodeId) // delete node itself
          // Delete associated edges
          for (let [edgeId, edge] of edges) {
            if (nodeId === edge[0] || nodeId === edge[1]) {
              edges.delete(edgeId);
            }
          }
        });
        return newNodes;
      });
    }
  }

  function onImgLoad({ target: img }: any) {
    setPcdImageDimensions({ height: img.offsetHeight, width: img.offsetWidth });
  }

  // calculate width and height for display of pcd image
  const imageDisplayDimensions = worldToPixel({
    x: props.pcdImageInfo?.world_dimensions?.width ?? 0,
    y: props.pcdImageInfo?.world_dimensions?.height ?? 0
  },
    { x: 0, y: 0 }, zoomLevel
  );
  // calculate offsets for image
  const worldOffset = worldToPixel({
    x: -(props.pcdImageInfo?.origin_camera.x ?? 0),
    y: props.pcdImageInfo?.origin_camera?.y ?? 0,
  }, combinedPanOffset, zoomLevel);
  const totalOffset = {
    x: worldOffset.x - imageDisplayDimensions.x / 2,
    y: worldOffset.y + imageDisplayDimensions.y / 2
  }
  const image_left = 'calc(' + totalOffset.x + 'px + 50%)';
  const image_top = 'calc(' + totalOffset.y + 'px + 50%)';

  return (
    <div className="edit-container">
      <div className='edit-params'>
        <p>Edit</p>
        <button onClick={() => { resetZoomLevel(); }}>Reset zoom</button>
        <button onClick={() => { resetPanOffset(); }}>Reset pan</button>
        {/* <pre>{JSON.stringify(dragStartPosWorld, null, 2)}</pre>
        <pre>{JSON.stringify(liveDragOffsetWorld, null, 2)}</pre> */}

      </div>
      <div className='edit-frame' id="edit-frame" ref={editDivRef}
        tabIndex={-1}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyPress}
        onKeyUp={handleKeyPress}
      >
        <>
          {/* <img src={"http://localhost:5000/./image_output/f9fff180-7302-4b2c-9e3f-541d6934cc75.png"} */}
            <img src={"http://localhost:5000/" + props.pcdImageInfo?.path}
            style={{
              left: image_left,
              top: image_top,
              position: 'absolute',
              width: imageDisplayDimensions.x,
              height: imageDisplayDimensions.y,
              pointerEvents: 'none',
            }} draggable={false} onLoad={onImgLoad} />
          {/* Nodes (circles)*/}
          {[...nodesWithDragOffset.entries()].map(([nodeId, node]) => {
            const pixelCoord = worldToPixel(node, combinedPanOffset, zoomLevel);
            const left = 'calc(' + pixelCoord.x + 'px + 50%)';
            const top = 'calc(' + pixelCoord.y + 'px + 50%';
            const isHovered = distance(mousePos, pixelCoord) < NODE_RADIUS_PX;
            const isSelected = selectedNodes.indexOf(nodeId) >= 0;
            const className = 'node' + (isHovered ? ' hovered' : '') + (isSelected ? ' selected' : '');
            return <div className={className} style={{ left: left, top: top, position: 'absolute', height: NODE_RADIUS_PX * 2, width: NODE_RADIUS_PX * 2 }} key={nodeId} ></div>
          })}
          {/* Edges (lines)*/}
          {[...edges.entries()].map(([edgeId, edge]) => {
            const nodeA = nodesWithDragOffset.get(edge[0]);
            const nodeB = nodesWithDragOffset.get(edge[1]);

            if (nodeA === undefined || nodeB === undefined) {
              console.error("Mismatch between nodes and edges");
              return null; // early exit
            }

            const averagePos = {
              x: (nodeA.x + nodeB.x) / 2,
              y: (nodeA.y + nodeB.y) / 2
            };
            const averagePosPixel = worldToPixel(averagePos, combinedPanOffset, zoomLevel);
            const length = Math.sqrt((nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2) * zoomLevel / PIXEL_TO_WORLD_FACTOR;
            const thickness = 4;
            const angle = Math.atan2(-(nodeB.y - nodeA.y), (nodeB.x - nodeA.x)) * (180 / Math.PI); // negative because of reversed y coordinate frame
            return <div key={edgeId} className="edge" style={{
              padding: '0px',
              margin: '0px',
              height: thickness + 'px',
              width: length + 'px',
              backgroundColor: "black",
              lineHeight: '1px',
              position: 'absolute',
              left: "calc(" + averagePosPixel.x + "px + 50%)",
              top: "calc(" + averagePosPixel.y.toString() + "px + 50%)",
              // ['MozTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
              // ['WebkitTransform' as any]: 'rotate(' + -angle + 'deg); translate(-50%, -50%)',
              // ['MsTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
              transform: "translate(-50%, -50%) rotate(" + angle + "deg) ",
            }}> </div>
          })}
          <ScaleBar zoomLevel={zoomLevel} />
        </>
      </div>
    </div>
  );
}

export default Edit;

import React, { useState, useRef, SyntheticEvent } from 'react';
import './Interface.css'
import { BoxProperties, Coordinate, boxParamsToGraph, PIXEL_TO_WORLD_FACTOR } from '../api';
import './Edit.css'
import ScaleMarker from './ScaleMarker';
import { distance } from '../geometry';

type EditProps = {
  boxProperties: BoxProperties | undefined,
  setBoxProperties: React.Dispatch<React.SetStateAction<BoxProperties | undefined>>
}

const minZoom = 0.1;
const maxZoom = 50;
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

  const graph = boxParamsToGraph(props.boxProperties);
  const [nodes, setNodes] = useState<Record<number, Coordinate>>(graph.nodes);
  const [edges, setEdges] = useState<Record<number, [number, number]>>(graph.edges);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Zooming, panning and mouse variables
  const defaultZoom = 1.0;
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [savedPanOffset, setSavedPanOffset] = useState({ x: 0, y: 0 });
  const [livePanOffset, setLivePanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const editDivRef = useRef<HTMLDivElement>(null);

  const combinedPanOffset = {
    x: livePanOffset.x + savedPanOffset.x,
    y: -livePanOffset.y - savedPanOffset.y, // negative because of reversed y coordinate frame
  };

  // Zooming, panning and mouse controls
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const editFrameElem = document.getElementById('edit-frame');
    if (editFrameElem != null) {
      const pixelCoord = {
        x: e.nativeEvent.offsetX - editFrameElem.clientWidth / 2,
        y: e.nativeEvent.offsetY - editFrameElem.clientHeight / 2,
      }

      setMousePos(pixelCoord);

      if (isPanning) {
        setLivePanOffset({ x: (pixelCoord.x - panStartPos.x) / zoomLevel, y: (pixelCoord.y - panStartPos.y) / zoomLevel });
      }
    }
    // console.log("mouse pos", mousePos);
  }
  function handleMouseDown(e: React.MouseEvent) {
    // Only do this for primary click
    if (e.button == 0) {

      const hoveredNodes = Object.keys(nodes).filter((nodeId) => {
        const pixelCoord = worldToPixel(nodes[parseInt(nodeId)], combinedPanOffset, zoomLevel);
        return distance(mousePos, pixelCoord) < NODE_RADIUS_PX;;
      });

      if (hoveredNodes.length === 0) {
        // start panning
        setPanStartPos(mousePos);
        setIsPanning(true);

        // reset selected nodes
        setSelectedNodes([]);
      }
    }
  }
  function finishPanning() {
    setIsPanning(false);
    setSavedPanOffset({
      x: livePanOffset.x + savedPanOffset.x,
      y: livePanOffset.y + savedPanOffset.y,
    });
    setLivePanOffset({
      x: 0, y: 0,
    });
  }
  function handleMouseUp(e: React.MouseEvent) {
    // Only work for primary button
    if (e.button === 0) {

      const hoveredNodes = Object.keys(nodes).filter((nodeId) => {
        const pixelCoord = worldToPixel(nodes[parseInt(nodeId)], combinedPanOffset, zoomLevel);
        return distance(mousePos, pixelCoord) < NODE_RADIUS_PX;;
      });
      console.log(hoveredNodes);
      console.log(selectedNodes)
      setSelectedNodes(prevSelected => {
        const isAlreadySelected = hoveredNodes.some(nodeId => {
          return prevSelected.indexOf(nodeId) >= 0;
        });
        // Deselect hovered nodes if any were previously selected
        if (isAlreadySelected) {
          const newSelected = prevSelected.filter(nodeId => {
            return hoveredNodes.indexOf(nodeId) < 0;
          });
          return newSelected;
        } else { // Otherwise select them
          const newSelected = prevSelected.concat(hoveredNodes);
          return newSelected;
        }
      });

      finishPanning();
    }
  }
  function handleMouseLeave() {
    finishPanning();
    if (editDivRef && editDivRef.current) {
      // Register our custom handleWheel function to prevent scrolling when mouse is over the edit div
      editDivRef.current.removeEventListener('wheel', handleWheel, false)
    }
  }
  function handleMouseEnter() {
    if (editDivRef && editDivRef.current) {
      // Unregister our custom handleWheel function that prevents scrolling when mouse is over the edit div
      editDivRef.current.addEventListener('wheel', handleWheel, { passive: false })
    }
  }
  function handleWheel(this: HTMLDivElement, e: WheelEvent): any {
    e.preventDefault() // stops from scrolling the rest of the page

    // Set the new zoom level based on amount scrolled
    // Specifically uses the functional update method rather than just setZoomLevel(newZoom),
    // since this avoids the issue of the state becoming stale. 
    // See https://stackoverflow.com/questions/55265255/react-usestate-hook-event-handler-using-initial-state 
    setZoomLevel(oldZoom => {
      const delta = e.deltaY * -0.0002;
      const proposedZoom = oldZoom + delta * oldZoom;
      let newZoom;
      if (proposedZoom < minZoom) {
        newZoom = minZoom;
      } else if (proposedZoom > maxZoom) {
        newZoom = maxZoom;
      } else {
        newZoom = proposedZoom;
      }
      return newZoom;
    });
  };

  return (
    <div className="edit-container">
      <div className='edit-params'>
        <p>Edit</p>
        <button onClick={() => { setZoomLevel(defaultZoom); }}>Reset zoom</button>
        <button onClick={() => { setSavedPanOffset({ x: 0, y: 0 }); }}>Reset pan</button>
        {/* <pre>{JSON.stringify(livePanOffset, null, 2)}</pre>
        <pre>{JSON.stringify(savedPanOffset, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(props.boxProperties, null, 2)}</pre> */}

      </div>
      <div className='edit-frame' id="edit-frame" ref={editDivRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <>
          {/* Nodes (circles)*/}
          {Object.keys(nodes).map((nodeId) => {
            const pixelCoord = worldToPixel(nodes[parseInt(nodeId)], combinedPanOffset, zoomLevel);
            const left = 'calc(' + pixelCoord.x + 'px + 50%)';
            const top = 'calc(' + pixelCoord.y + 'px + 50%';
            const isHovered = distance(mousePos, pixelCoord) < NODE_RADIUS_PX;
            const isSelected = selectedNodes.indexOf(nodeId) >= 0;
            const className = 'node' + (isHovered ? ' hovered' : '') + (isSelected ? ' selected' : '');
            return <div className={className} style={{ left: left, top: top, position: 'absolute', height: NODE_RADIUS_PX * 2, width: NODE_RADIUS_PX * 2 }} key={nodeId} ></div>
          })}
          {/* Edges (lines)*/}
          {Object.keys(edges).map((edgeId) => {
            const edge = edges[parseInt(edgeId)];
            const nodeA = nodes[edge[0]];
            const nodeB = nodes[edge[1]];

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
          <ScaleMarker zoomLevel={zoomLevel} />
        </>
      </div>
    </div>
  );
}

export default Edit;

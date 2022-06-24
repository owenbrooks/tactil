import React, { useState, useRef, useEffect } from 'react';
import { BoxProperties, Coordinate, boxParamsToGraph, graphToBoxParams, ImageInfo, Graph } from '../../api/api';
import ScaleBar from '../ScaleBar';
import './Edit.css'
import useZoom from './useZoom';
import usePan from './usePan';
import GraphView from './Graph';
import PcdImage from './PcdImage';
import useAddNode from './useAddNode';
import useDrag, { findHoveredIds } from './useDrag';
import { useSelected } from './useSelected';

type EditProps = {
  boxProperties: BoxProperties | undefined,
  setBoxProperties: React.Dispatch<React.SetStateAction<BoxProperties | undefined>>,
  pcdImageInfo: ImageInfo | undefined,
};

export type ViewState = {
  panOffset: Coordinate,
  zoomLevel: number,
};

export enum EditorMode {
  Edit = 1,
  Add = 2
}

const NODE_RADIUS_PX = 13 / 2; // used for mouse overlap detection and drawing

function Edit(props: EditProps) {

  const initialGraph = boxParamsToGraph(props.boxProperties);
  const [graph, setGraph] = useState<Graph>(initialGraph)

  // Keyboard state
  const [controlHeld, setControlHeld] = useState(false);

  // Zooming, panning and mouse variables
  const editDivRef = useRef<HTMLDivElement>(null); // used to enable and disable zoom controls / scrolling
  const defaultZoom = 2.0;
  const minZoom = 0.1;
  const maxZoom = 50;
  const [zoomLevel, startZoomListen, stopZoomListen, resetZoomLevel] = useZoom(defaultZoom, maxZoom, minZoom, editDivRef);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [combinedPanOffset, panHandleMouseDown, panHandleMouseUp, stopPanning, panHandleMouseMove, resetPanOffset] = usePan(zoomLevel, mousePos);
  const viewState: ViewState = {
    panOffset: combinedPanOffset,
    zoomLevel,
  };
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.Edit);
  const hoveredNodes = findHoveredIds(mousePos, viewState, graph, NODE_RADIUS_PX);
  const { unplacedId, graphWithUnplaced, handleClickAddNode, resetPreviousAddition } =
    useAddNode(mousePos, editorMode, graph, setGraph, viewState, hoveredNodes);
  const hoveredNodesWithUnplaced = unplacedId ? [...hoveredNodes, unplacedId] : [...hoveredNodes]; // make the unplaced node always appear hovered

  const { selectedNodes, deselectAll, selectionHandleClick, selectionHandleKeyPress } = useSelected(hoveredNodes, setGraph, editorMode);
  const {
    isDragging,
    cancelDragging,
    dragHandleMouseUp,
    dragHandleMouseDown,
    dragHandleMouseMove,
  } = useDrag(graph, setGraph, mousePos, viewState, hoveredNodes, selectedNodes, deselectAll, editorMode);

  // Update graph when nodes or edges are changed
  const { setBoxProperties } = props;
  useEffect(() => {
    const newBoxProperties = graphToBoxParams(graph);
    setBoxProperties(newBoxProperties);
  }, [graph, setBoxProperties])

  // Panning and mouse controls
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
    dragHandleMouseMove();
  }
  function handleMouseDown(e: React.MouseEvent) {
    dragHandleMouseDown(e);
    if (hoveredNodes.length === 0) {
      // Start panning if no nodes are hovered   
      panHandleMouseDown(e, controlHeld);
    }
    handleClickAddNode();
  }
  function handleMouseUp(e: React.MouseEvent) {
    // Finish and apply panning and dragging
    dragHandleMouseUp(e);
    panHandleMouseUp(e, controlHeld);
    selectionHandleClick(isDragging);
  }

  // When the mouse exits the editing box, stop panning/dragging and allow scrolling again
  function handleMouseLeave() {
    stopPanning();
    cancelDragging();
    stopZoomListen();
  }
  function handleMouseEnter() {
    startZoomListen();
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    selectionHandleKeyPress(e);
    if (e.key === 'Control') {
      setControlHeld(e.type === 'keydown');
    } else if (e.key === 'n' && e.type === 'keydown') {
      // Enter mode to add nodes
      if (editorMode === EditorMode.Edit) {
        setEditorMode(EditorMode.Add);
        deselectAll();
      } else {
        setEditorMode(EditorMode.Edit);
        resetPreviousAddition();
      }
    } else if (e.key === 'Escape' && e.type === 'keydown') {
      resetPreviousAddition();
    }
  }

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
          {props.pcdImageInfo &&
            <PcdImage zoomLevel={zoomLevel} panOffset={combinedPanOffset} imageInfo={props.pcdImageInfo} />
          }
          <GraphView
            zoomLevel={zoomLevel}
            nodes={graphWithUnplaced.nodes}
            edges={graphWithUnplaced.edges}
            combinedPanOffset={combinedPanOffset}
            nodeRadiusPx={NODE_RADIUS_PX}
            selectedNodes={selectedNodes}
            hoveredNodes={hoveredNodesWithUnplaced} // append unplaced node to highlight it
          />
          <ScaleBar zoomLevel={zoomLevel} />
        </>
      </div>
    </div>
  );
}

export default Edit;

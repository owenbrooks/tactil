import React, { useState, useRef, useEffect } from 'react';
import { Coordinate, ImageInfo, VectorMap, vectorMapToGraph, graphToVectorMap } from '../../api/api';
import ScaleBar from '../ScaleBar';
import './Edit.css'
import useZoom from './useZoom';
import usePan from './usePan';
import GraphView from './GraphView';
import PcdImage from './PcdImage';
import useAddNode from './useAddNode';
import { useDragGraph, findHoveredIds } from './useDrag';
import { useSelected } from './useSelected';
import useEventListener from './useEventListener';
import useUndo from './useUndo';
import LabelView from './LabelView';
import useLabels from './useLabels';
// import AddLabel from './AddLabel';
// import Help from './Help';

type EditProps = {
  vectorMap: VectorMap | undefined,
  setVectorMap: React.Dispatch<React.SetStateAction<VectorMap | undefined>>,
  pcdImageInfo: ImageInfo | undefined,
};

export type ViewState = {
  panOffset: Coordinate,
  zoomLevel: number,
};

export enum EditorMode {
  Edit = 1,
  AddNode = 2,
}

const NODE_RADIUS_PX = 13 / 2; // used for mouse overlap detection and drawing

function Edit(props: EditProps) {

  const isDebugEnvironment = process.env.REACT_APP_TACTIL_ENV === 'debug';
  const { vectorMap } = props;
  const initialGraph = vectorMapToGraph(vectorMap);
  const [
    graphState,
    {
      set: setGraph,
      undo: undoGraph,
      redo: redoGraph,
      canUndo,
      canRedo,
    },
  ] = useUndo(initialGraph);
  const { present: graph } = graphState;

  // Keyboard state
  const [controlHeld, setControlHeld] = useState(false);

  const [showBackgroundImage, setShowBackgroundImage] = useState(true);

  function toggleBackgroundImage() {
    setShowBackgroundImage(!showBackgroundImage);
  }

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
  const { unplacedId, graphWithUnplaced, handleClickAddNode, resetPreviousAddition, extendingEdge } =
    useAddNode(mousePos, editorMode, graph, setGraph, viewState, hoveredNodes);
  const hoveredNodesWithUnplaced = unplacedId ? [...hoveredNodes, unplacedId] : [...hoveredNodes]; // make the unplaced node always appear hovered

  const { selectedNodes, selectAllNodes, deselectAllNodes, selectionHandleClick, selectionHandleKeyPress, deleteSelectedNodes } = useSelected(hoveredNodes, graph, setGraph, editorMode);
  const {
    graphWithDragOffset,
    isDragging,
    cancelDraggingGraph: cancelDragging,
    dragGraphHandleMouseUp,
    dragGraphHandleMouseDown,
  } = useDragGraph(graph, setGraph, mousePos, viewState, hoveredNodes, selectedNodes, deselectAllNodes, editorMode);

  const graphToDisplay = editorMode === EditorMode.AddNode ? graphWithUnplaced : graphWithDragOffset;

  const { labelsWithDragOffset, selectedLabels, editingLabelIndex, selectAllLabels, deselectAllLabels, labelsHandleClick, handleLabelChange, stopEditingLabel, labelsHandleMouseUp } = useLabels(graph, setGraph, mousePos, viewState);

  // Update parent's box properties when nodes or edges are changed
  const { setVectorMap } = props;
  useEffect(() => {
    const newVectorMap = graphToVectorMap(graph);
    setVectorMap(newVectorMap);
  }, [graph, setVectorMap])

  // Panning and mouse controls
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const editFrameElem = document.getElementById('edit-frame');
    if (editFrameElem != null) {
      // Calculate relative mouse coordinate in pixels. Center of frame is 0,0. Down-right is positive.
      const pixelCoord = {
        x: e.pageX - editFrameElem?.offsetLeft - editFrameElem.clientWidth / 2,
        y: e.pageY - editFrameElem?.offsetTop - editFrameElem.clientHeight / 2,
      }
      setMousePos(pixelCoord);

      if (e.target === editFrameElem && editorMode === EditorMode.Edit) { // only apply if not clicking on a child element
        panHandleMouseMove(pixelCoord);
      }
    }
  }
  function handleMouseDown(e: React.MouseEvent) {
    dragGraphHandleMouseDown(e);

    const editFrameElem = document.getElementById('edit-frame');
    if (e.target === editFrameElem) { // only true when not clicking a child element inside the frame
      if (hoveredNodes.length === 0) {
        // Start panning if no nodes are hovered
        panHandleMouseDown(e, controlHeld);
      }
      deselectAllLabels();
    }

    handleClickAddNode();
    selectionHandleClick(isDragging);
  }
  function handleMouseUp(e: React.MouseEvent) {
    // Finish and apply panning and dragging
    dragGraphHandleMouseUp(e);
    panHandleMouseUp(e, controlHeld);
    selectionHandleClick(isDragging);
    labelsHandleMouseUp();
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

  useEventListener('keydown', (e) => {
    handleKeyPress(e);
  });
  useEventListener('keyup', (e) => {
    handleKeyPress(e);
  });

  function startAdding() {
    setEditorMode(EditorMode.AddNode);
    deselectAllNodes();
  }
  function stopAdding() {
    setEditorMode(EditorMode.Edit);
    resetPreviousAddition();
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    selectionHandleKeyPress(e);
    if (e.key === 'Control') {
      setControlHeld(e.type === 'keydown');
    } else if (e.key === 'n' && e.type === 'keydown') {
      // Enter mode to add nodes
      if (editorMode === EditorMode.Edit) {
        startAdding();
      } else {
        stopAdding();
      }
    } else if (e.key === 'Escape' && e.type === 'keydown') {
      resetPreviousAddition();
      // if haven't just added a node, leave adding mode
      if (!extendingEdge) {
        setEditorMode(EditorMode.Edit)
      }
      deselectAllNodes();
      stopEditingLabel();
    } else if (e.key === 'z' && e.type === 'keydown' && e.ctrlKey) {
      handleUndo();
    } else if (e.key === 'y' && e.type === 'keydown' && e.ctrlKey) {
      handleRedo();
    } else if (e.key === 'Enter' && e.type === 'keydown') {
      stopEditingLabel();
    } else if (e.key === 'a' && e.ctrlKey && e.type === 'keydown') {
      // select all elements only if the edit frame is currently focussed
      // don't want to prevent normal behaviour otherwise
      const editFrameElem = document.getElementById('edit-frame');
      if (document.activeElement === editFrameElem) {
        selectAllLabels();
        selectAllNodes();
        e.preventDefault();
      }
    } else if (e.key === 'h' && e.type === 'keydown') {
      toggleBackgroundImage();
    }
  }

  function handleVectorMapUpload(event: React.ChangeEvent<HTMLInputElement>) {
    // if a file has been uploaded, parse it and set the VectorMap
    if (event.target.files?.length) {
      const fileReader = new FileReader();
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target?.result) {
          let uploadedVectorMap: any = JSON.parse(e.target.result as string); // TODO: handle conversion error
          // convert features from object to Map type
          let featureMap = new Map();
          for (let id in uploadedVectorMap.features) {
            let feature = uploadedVectorMap.features[id];
            featureMap.set(parseInt(id), feature);
          }
          uploadedVectorMap.features = featureMap;

          setGraph(vectorMapToGraph(uploadedVectorMap));
          (event.target.value as any) = null;
        }
      };
      fileReader.onerror = e => {
        console.error(e);
        alert("Failed to process uploaded file. Ensure you upload a valid .json file.");
      }
    }
  }
  function saveVectorMap() {
    if (props.vectorMap) {
      let features = Object.fromEntries(props.vectorMap.features.entries());
      let vmap = { edges: [...props.vectorMap.edges], labels: [...props.vectorMap.labels], vertices: [...props.vectorMap.vertices], features: features };
      let vmapString = JSON.stringify(vmap);

      // Create and downlaod file object (https://thelearning.dev/how-to-download-files-on-button-click-reactjs)
      const file = new Blob([vmapString], { type: 'text/json' });
      // Dummy link to trigger the download
      const element = document.createElement("a");
      element.href = URL.createObjectURL(file);
      element.download = "map-" + Date.now() + ".json";
      // Simulate link click
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  }
  function handleUndo() {
    undoGraph();
    resetPreviousAddition();
  }
  function handleRedo() {
    redoGraph();
    resetPreviousAddition();
  }

  return (
    <div className="edit-container">
      <div className='edit-params'>
        <p>Edit</p>
        <div>
          <button onClick={() => { resetZoomLevel(); }}>Reset zoom</button>
          <button onClick={() => { resetPanOffset(); }}>Reset pan</button>
        </div>
        <div>
          <button onClick={handleUndo} disabled={!canUndo}>Undo (Ctrl+Z)</button>
          <button onClick={handleRedo} disabled={!canRedo}>Redo (Ctrl+Y)</button>
        </div>
        <div>
          <button onClick={startAdding} disabled={editorMode === EditorMode.AddNode}>Add/extend wall (N)</button>
          <button onClick={stopAdding} disabled={editorMode === EditorMode.Edit}>Stop extending (N)</button>
        </div>
        {/* <div>
          <AddLabel graph={graph} setGraph={setGraph} />
        </div> */}
        <div>
          <button onClick={deleteSelectedNodes} disabled={selectedNodes.length === 0}>Delete selected (Del)</button>
        </div>
        <div>
          <button onClick={toggleBackgroundImage}>{showBackgroundImage ? "Hide background image (H)" : "Show background image (H)"}</button>
        </div>
        {isDebugEnvironment &&
          <>
            <div>
              <br />
              Upload map
              <input type="file" onChange={handleVectorMapUpload} />
              <button onClick={saveVectorMap}>Save map</button>
            </div>
          </>
        }
        {/* <pre>{JSON.stringify(isDragging)}</pre> */}
      </div>
      <div className='edit-frame' id="edit-frame" ref={editDivRef}
        tabIndex={-1}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <>
          {props.pcdImageInfo && showBackgroundImage &&
            <PcdImage zoomLevel={zoomLevel} panOffset={combinedPanOffset} imageInfo={props.pcdImageInfo} />
          }
          <GraphView
            zoomLevel={zoomLevel}
            nodes={graphToDisplay.nodes}
            edges={graphToDisplay.edges}
            combinedPanOffset={combinedPanOffset}
            nodeRadiusPx={NODE_RADIUS_PX}
            selectedNodes={selectedNodes}
            hoveredNodes={hoveredNodesWithUnplaced} // append unplaced node to highlight it
          />
          <LabelView
            labels={labelsWithDragOffset}
            viewState={viewState}
            selectedLabels={selectedLabels}
            editingLabelIndex={editingLabelIndex}
            labelsHandleClick={labelsHandleClick}
            handleLabelChange={handleLabelChange}
            labelsHandleMouseUp={labelsHandleMouseUp}
          />
          <ScaleBar zoomLevel={zoomLevel} />
          {/* <Help /> */}
        </>
      </div>
    </div>
  );
}

export default Edit;

import { useState } from 'react';
import './Interface.css'
import { BoxOutputs } from '../api';
import './Edit.css'

type EditProps = {
  boxOutputs: BoxOutputs | undefined,
  setBoxOutputs: React.Dispatch<React.SetStateAction<BoxOutputs | undefined>>
}

const minZoom = 0.3;
const maxZoom = 50;
const pixelToWorldFactor = 0.1;

type Coordinate = {
  x: number,
  y: number,
}

function pixelToWorld(pixelCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
  const x = pixelToWorldFactor * (pixelCoord.x - pixelOffset.x) / zoomLevel;
  const y = pixelToWorldFactor * (pixelCoord.y - pixelOffset.x) / zoomLevel;

  return {
    x: x,
    y: y,
  }
}

function worldToPixel(worldCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
  const x = worldCoord.x * zoomLevel / pixelToWorldFactor + pixelOffset.x;
  const y = worldCoord.y * zoomLevel / pixelToWorldFactor + pixelOffset.y;
  return {
    x: x,
    y: y,
  }
}

function Edit(props: EditProps) {

  const defaultNodes: Record<number, Coordinate> = { 0: { x: 0.0, y: 0.0 }, 1: { x: 10.0, y: 10.0 }, 2: {x: -5, y:-8}, 3:{x: -10, y:5} };
  const defaultEdges: Record<number, [number, number]> = { 0: [0, 1], 1: [0, 2], 2: [2, 3] };
  const [nodes, setNodes] = useState<Record<number, Coordinate>>(defaultNodes);
  const [edges, setEdges] = useState<Record<number, [number, number]>>(defaultEdges);
  const defaultZoom = 1.0;
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [savedPanOffset, setSavedPanOffset] = useState({ x: 0, y: 0 });
  const [livePanOffset, setLivePanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const editFrameElem = document.getElementById('edit-frame');
    if (editFrameElem != null) {
      const height = editFrameElem.clientHeight;
      const width = editFrameElem.clientWidth;

      const pixelCoord = {
        x: e.nativeEvent.offsetX - width / 2,
        y: e.nativeEvent.offsetY - height / 2,
      }

      setMousePos(pixelCoord);

      if (isPanning) {
        setLivePanOffset({ x: pixelCoord.x - panStartPos.x, y: pixelCoord.y - panStartPos.y });
      }
    }
    // console.log("mouse pos", mousePos);
  }

  function handleMouseDown() {
    setPanStartPos(mousePos)
    setIsPanning(true);
  }
  function handleMouseUp() {
    setIsPanning(false);
    setSavedPanOffset({
      x: livePanOffset.x + savedPanOffset.x,
      y: livePanOffset.y + savedPanOffset.y,
    });
    setLivePanOffset({
      x: 0, y: 0,
    });
  }
  function resetZoom() {
    setZoomLevel(defaultZoom);
  }
  function resetPan() {
    setSavedPanOffset({ x: 0, y: 0 });
  }

  const onScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY * -0.002;
    const newZoom = zoomLevel + delta;
    if (newZoom < minZoom) {
      setZoomLevel(minZoom);
    } else if (newZoom > maxZoom) {
      setZoomLevel(maxZoom);
    } else {
      setZoomLevel(newZoom);
    }
  };

  return (
    <div className="edit-container">
      <div className='edit-params'>
        <p>Edit</p>
        <button onClick={resetZoom}>Reset zoom</button>
        <button onClick={resetPan}>Reset pan</button>
      </div>
      <div className='edit-frame' id="edit-frame"
        onWheelCapture={onScroll}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <>
          {Object.keys(nodes).map((nodeId) => {
            const combinedPanOffset = {
              x: livePanOffset.x + savedPanOffset.x,
              y: livePanOffset.y + savedPanOffset.y,
            };
            const { x, y } = worldToPixel(nodes[parseInt(nodeId)], combinedPanOffset, zoomLevel);
            const left = 'calc(' + x + 'px + 50%)';
            const top = 'calc(' + y + 'px + 50%';
            return <div className='node' style={{ left: left, top: top, position: 'absolute' }} key={nodeId} ></div>
          })}
          {Object.keys(edges).map((edgeId) => {
            const edge = edges[parseInt(edgeId)];
            const nodeA = nodes[edge[0]];
            const nodeB = nodes[edge[1]];

            const averagePos = {
              x: (nodeA.x + nodeB.x) / 2,
              y: (nodeA.y + nodeB.y) / 2
            };
            const combinedPanOffset = {
              x: livePanOffset.x + savedPanOffset.x,
              y: livePanOffset.y + savedPanOffset.y,
            };
            const averagePosPixel = worldToPixel(averagePos, combinedPanOffset, zoomLevel);
            const length = Math.sqrt((nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2)*zoomLevel/pixelToWorldFactor;
            const thickness = 4;
            const angle = Math.atan2((nodeB.y-nodeA.y),(nodeB.x-nodeA.x))*(180/Math.PI);
            return <div key={edgeId} style={{
              padding: '0px', 
              margin: '0px', 
              height: thickness + 'px', 
              width: length + 'px',
              backgroundColor:"black", 
              lineHeight:'1px', 
              position:'absolute', 
              left: "calc(" + averagePosPixel.x + "px + 50%)", 
              top: "calc(" + averagePosPixel.y.toString() + "px + 50%)", 
              // ['MozTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
              // ['WebkitTransform' as any]: 'rotate(' + -angle + 'deg); translate(-50%, -50%)',
              // ['MsTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
              transform: "translate(-50%, -50%) rotate(" + angle + "deg) ",
            }}> </div>
              //  -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />
          })}
        </>
      </div>
      {/* <pre>{JSON.stringify(props.boxOutputs, null, 2)}</pre> */}
    </div>
  );
}

export default Edit;

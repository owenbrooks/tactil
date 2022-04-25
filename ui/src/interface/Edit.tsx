import { SyntheticEvent, useState } from 'react';
import './Interface.css'
import { BoxOutputs, postData } from '../api';
import './Edit.css'
const generate_url = "http://localhost:5000/generate";

type EditProps = {
  boxOutputs: BoxOutputs | undefined,
  setBoxOutputs: React.Dispatch<React.SetStateAction<BoxOutputs | undefined>>
}

const minZoom = 0.1;
const maxZoom = 50;

function Edit(props: EditProps) {

  const defaultNodes: Record<number, [number, number]> = {0: [0.0, 0.0], 1: [10.0, 10.0], 2: [-5, -8]};
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [nodes, setNodes] = useState<Record<number, [number, number]>>(defaultNodes);

  const onScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY * -0.01;
    const newZoom = zoomLevel + delta;
    if (newZoom > minZoom && newZoom < maxZoom) {
      setZoomLevel(newZoom);
    }
  };

  return (
    <div className="edit-container">
      {/* <p>Edit</p> */}
      <div className='edit-params'>Edit</div>
      <div className='edit-frame' onWheelCapture={onScroll} >
        {Object.keys(nodes).map((nodeId) => {
          const x = nodes[parseInt(nodeId)][0] * zoomLevel;
          const y = nodes[parseInt(nodeId)][1] * zoomLevel;
          const left = 'calc(' + x + 'px + 50%)';
          const top = 'calc(' + y + 'px + 50%';
          return <div className='node' style={{left: left, top: top, position:'absolute'}}></div>
        })}
      </div>
      {/* <pre>{JSON.stringify(props.boxOutputs, null, 2)}</pre> */}
    </div>
  );
}

export default Edit;

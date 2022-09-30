import { SyntheticEvent, useState } from 'react';
import { postDataToApi, serializeVectorMap, VectorMap } from '../../api/api';
const generateUrl = "/generate";
const outputUrl = "/api/generate/output";

type GenerateProps = {
  vectorMap: VectorMap | undefined,
}

type PhysicalParameters = {
  model_scale_factor: number,
  wall_height_mm: number,
  wall_thickness_mm: number,
  border_width_mm: number,
  floor_thickness_mm: number,
}

const defaultModelParams: PhysicalParameters = {
  model_scale_factor: 1 / 120,
  wall_height_mm: 2.5,
  wall_thickness_mm: 2.5,
  border_width_mm: 5,
  floor_thickness_mm: 5,
}

function Generate(props: GenerateProps) {
  const [modelParams, setModelParams] = useState(defaultModelParams)

  const handleGenerate = (_: SyntheticEvent) => {
    if (props.vectorMap !== undefined) {
      const generatePayload = { "vector_map": serializeVectorMap(props.vectorMap), "model_params": modelParams };
      postDataToApi(generateUrl, generatePayload).then(_ => {
        // Automatically download file when it is ready
        fetch(outputUrl).then((response) => {
          response.blob().then((blob) => {
            // Create dummy link element to hold file
            const element = document.createElement("a");
            element.href = URL.createObjectURL(blob);
            element.download = "model-" + Date.now() + ".stl";
            // Simulate link click to download
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
          });
        });
      }).catch((error: Error) => {
        console.error(error);
      });
    } // TODO: handle undefined/empty case, download error
  }

  // TODO: add error handling to invalid inputs rather than just setting defaults
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scaleInput = parseFloat(e.target.value);
    if (scaleInput !== 0) {
      const scaleFactor = 1 / scaleInput;
      if (scaleFactor !== null && !isNaN(scaleFactor) && scaleFactor > 0) {
        setModelParams({
          ...modelParams,
          model_scale_factor: scaleFactor,
        });
      }
    }
  }
  const handleWallHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseFloat(e.target.value);
    if (newHeight > 0) {
      setModelParams({
        ...modelParams,
        wall_height_mm: newHeight,
      });
    }
  }
  const handleWallThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThickness = parseFloat(e.target.value);
    if (newThickness > 0) {
      setModelParams({
        ...modelParams,
        wall_thickness_mm: parseFloat(e.target.value),
      });
    }
  }
  const handleFloorThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThickness = parseFloat(e.target.value);
    if (newThickness >= 0) {
      setModelParams({
        ...modelParams,
        floor_thickness_mm: parseFloat(e.target.value),
      });
    }
  }
  const handleBorderWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseFloat(e.target.value);
    if (newWidth >= 0) {
      setModelParams({
        ...modelParams,
        border_width_mm: parseFloat(e.target.value),
      });
    }
  }

  return (
    <div className="interface">
      <h1>Generate 3D Model</h1>
      <div>
        Scale Factor
        <br />
        <input type="number" onChange={handleScaleChange} value={1/modelParams.model_scale_factor} />:1
      </div>
      <br />
      <div>
        Wall Height
        <br />
        <input type="number" onChange={handleWallHeightChange} value={modelParams.wall_height_mm} />mm
      </div>
      <br />
      <div>
        Wall Thickness
        <br />
        <input type="number" onChange={handleWallThicknessChange} value={modelParams.wall_thickness_mm} />mm
      </div>
      <br />
      <div>
        Border Width
        <br />
        <input type="number" onChange={handleBorderWidthChange} value={modelParams.border_width_mm} />mm
      </div>
      <br />
      <div>
        Floor Thickness
        <br />
        <input type="number" onChange={handleFloorThicknessChange} value={modelParams.floor_thickness_mm} />mm
      </div>
      <br />
      <div>
        <button onClick={handleGenerate}>Generate</button>
      </div>
      <br />
      {/* <pre>{JSON.stringify(modelParams, null, 2)}</pre> */}
    </div >

  );
}

export default Generate;

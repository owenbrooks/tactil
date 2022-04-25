import { SyntheticEvent, useState } from 'react';
import { useLocation } from "react-router-dom";
import { LocationState, postData } from '../api';
const generate_url = "http://localhost:5000/generate"

function Generate() {

  const [generateFinished, setGenerateFinished] = useState(false);

  const handleGenerate = (_: SyntheticEvent) => {
    const data = {"box_outputs": box_outputs};
    postData(generate_url, data).then(response => {
      console.log(response);
      setGenerateFinished(true);
    })
  }

  const location = useLocation().state as LocationState;
  const box_outputs = location?.box_outputs;
  console.log(location)

  return (
    <div className="interface">
      <div>
        <button onClick={handleGenerate}>Generate</button>
      </div>
      <br />
      {generateFinished && <a href="http://localhost:5000/generate/output" download target="_self">Download</a>}
      {/* <pre>{JSON.stringify(box_outputs, null, 2)}</pre> */}
    </div>
  );
}

export default Generate;

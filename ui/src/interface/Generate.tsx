import { SyntheticEvent, useState } from 'react';
import { postData, VectorMap } from '../api/api';
const generateUrl = "http://localhost:5000/generate"
const outputUrl = generateUrl + "/output";

type GenerateProps = {
  vectorMap: VectorMap | undefined,
}

function Generate(props: GenerateProps) {

  const [generateFinished, setGenerateFinished] = useState(false);

  const handleGenerate = (_: SyntheticEvent) => {
    const generatePayload = { "vector_map": props.vectorMap };
    postData(generateUrl, generatePayload).then(response => {
      console.log(response);
      setGenerateFinished(true);
    });
  }

  return (
    <div className="interface">
      <div>
        <button onClick={handleGenerate}>Generate</button>
      </div>
      <br />
      {generateFinished && <a href={outputUrl} download target="_self">Download</a>}
    </div>
  );
}

export default Generate;

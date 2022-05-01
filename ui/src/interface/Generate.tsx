import { SyntheticEvent, useState } from 'react';
import { BoxProperties, postData } from '../api/api';
const generate_url = "http://localhost:5000/generate"

type GenerateProps = {
  boxProperties: BoxProperties | undefined,
}

function Generate(props: GenerateProps) {

  const [generateFinished, setGenerateFinished] = useState(false);

  const handleGenerate = (_: SyntheticEvent) => {
    const data = {"box_outputs": props.boxProperties};
    postData(generate_url, data).then(response => {
      console.log(response);
      setGenerateFinished(true);
    })
  }

  return (
    <div className="interface">
      <div>
        <button onClick={handleGenerate}>Generate</button>
      </div>
      <br />
      {generateFinished && <a href="http://localhost:5000/generate/output" download target="_self">Download</a>}
    </div>
  );
}

export default Generate;

import { Link } from 'react-router-dom';
import './Home.css'

function Home() {

  return (
    <div className="instruction-page">
      <h1>Getting started</h1>
      <p>3D-printed maps can be used by people who are blind or have low vision to help them navigate unfamiliar spaces. This app allows you to create 3D-printable maps from a scan taken using a mobile device. </p>
      <h2>Steps</h2>
      <div>
        <ol>
          <li>Take a scan</li>
          <li>Upload the scan</li>
          <li>Edit the map</li>
          <li>Generate a 3D model</li>
        </ol>
        <Link to="/scan">Go to Step 1: Take a scan</Link>
        {/* <button onClick={handleGenerate}>Generate</button> */}
      </div>
      <br />
    </div>
  );
}

export default Home;
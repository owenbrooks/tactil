import { Link } from 'react-router-dom';
import './Home.css'
import model from './example-model.jpg';
import edit from './example-edit.jpg';
import pointcloud from './example-pointcloud.jpg';
import scan from '../scan/scan_mode.jpg'

function Home() {
  return (
    <div className="instruction-page px-4 md:px-12">
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
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border items-center'>
        <img src={scan} className='w-full my-4 border-0 border-gray-800 border-solid' alt="iPad lidar scanning app screenshot" />
        <img src={pointcloud} className='w-full my-4 border-0 border-gray-800 border-solid' alt="Point cloud of apartment" />
        <img src={edit} className='w-full my-4 border-0 border-gray-800 border-solid' alt="Editing view of tactile map" />
        <img src={model} className='w-full my-4 border-0 border-gray-800 border-solid' alt="3D-printed model of apartment walls" />
      </div>
      <br />
    </div>
  );
}

export default Home;

import { Link } from 'react-router-dom';
import './Home.css'

function Scan() {

  return (
    <div className="instruction-page">
      <h1>Taking a Scan</h1>
      <p>Scans can be created using the <a href="https://apps.apple.com/us/app/3d-scanner-app/id1419913995">3D Scanner App</a> on an iOS device with a LiDAR sensor (iPhone 12/13 Pro, iPad Pro 2020 or newer).</p>
      <ol>
        <li>Open 3D Scanner App</li>
        <li>Set Scan Mode to LiDAR/Normal</li>
        <li>Point the camera at a corner of the room, about 1 metre away from the wall</li>
        <li>Press the red button to begin scanning</li>
        <li>Make your way around the room until all the walls have been scanned</li>
        <li>Press the red button to finish scanning</li>
        <li>Choose "HD" process mode</li>
        <li>Press "Start" and wait for the scan to be processed</li>
      </ol>
      <h2>Sending scan to computer</h2>
      <ol>
        <li>Press the blue "Share" button</li>
        <li>Choose "Point Cloud"</li>
        <li>Make sure "Z axis up" is enabled</li>
        <li>Choose "PCD"</li>
        <li>Share using Google Drive</li>
        <li>Press "UPLOAD"</li>
        <li>The file can now be downloaded by going to <a href="https://drive.google.com/">drive.google.com</a></li>
      </ol>
    </div>
  );
}

export default Scan;

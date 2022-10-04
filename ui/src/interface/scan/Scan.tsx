import '../home/Home.css'
import scan_mode from './scan_mode.jpg'
import medium from './medium.jpg'
import pointcloud from './pointcloud.jpg'
import low_pcd_zup from './low_pcd_zup.jpg'
import share_button from './share_button.jpg'

function Scan() {

  const imageStyle = { width: '40%', marginLeft: 'auto', marginRight: 'auto', display: 'block', border: '2px solid black'};

  return (
    <div className="instruction-page">
      <h1>Taking a Scan</h1>
      <p>Scans can be created using the <a href="https://apps.apple.com/us/app/3d-scanner-app/id1419913995">3D Scanner App</a> on an iOS device with a LiDAR sensor (iPhone 12/13 Pro, iPad Pro 2020 or newer).</p>
      <div>
        <ol>
          <li>Open 3D Scanner App</li>
          <li>Set Scan Mode to LiDAR/Normal</li>
          <li>Point the camera at a corner of the room, about 1 metre away from the wall</li>
          <li>Press the red button to begin scanning</li>
          <li>Make your way around the room until all the walls have been scanned</li>
        </ol>
        <img src={scan_mode} style={imageStyle} alt="Scan mode selection screenshot" />
      </div>
      <div>
        <ol start={6}>
          <li>Press the red button to finish scanning</li>
          <li>Choose "Medium" process mode</li>
          <li>Press "Start" and wait for the scan to be processed</li>
        </ol>
        <img src={medium} style={imageStyle} alt="Process quality selection screenshot" />
      </div>
      <h2>Sending scan to computer</h2>
      <div>
        <ol>
          <li>Press the blue "Share" button</li>
        </ol>
        <img src={share_button} style={imageStyle} alt="Share button screenshot" />
      </div>
      <div>
        <ol start={2}>
          <li>Choose "Point Cloud"</li>
        </ol>
        <img src={pointcloud} style={imageStyle} alt="Export type screenshot" />
      </div>
      <div>
        <ol start={3}>
          <li>Make sure "Z axis up" is enabled</li>
          <li>Choose "Low Density"</li>
          <li>Choose "PCD"</li>
        </ol>
        <img src={low_pcd_zup} style={imageStyle} alt="Pointcloud export parameters screenshot" />
      </div>
      <div>
        <ol start={6}>
          <li>Share using Google Drive</li>
          <li>Press "UPLOAD"</li>
          <li>The file can now be downloaded by going to <a href="https://drive.google.com/">drive.google.com</a></li>
        </ol>
      </div>
    </div>
  );
}

export default Scan;

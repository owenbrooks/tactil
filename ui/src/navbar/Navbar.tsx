import React from 'react';
import logo from './logo.svg';
import './Navbar.css'
import upload from './upload.svg'
import edit from './edit.svg'
import generate from './generate.svg'

function Navbar() {
  return (
    <div className="sidenav">
      {/* <div className='nav-item'> */}
        <a href="#about"><img src={upload} />Upload</a>
      {/* </div> */}
      {/* <div className='nav-item'> */}
        <a href="#services"><img src={edit} />Edit</a>
      {/* </div> */}
      {/* <div className='nav-item'> */}
        <a href="#clients"><img src={generate} />Generate</a>
      {/* </div> */}

    </div>
  );
}

export default Navbar;

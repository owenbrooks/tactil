import React from 'react';
import './Navbar.css'
import upload from './upload.svg'
import edit from './edit.svg'
import generate from './generate.svg'

function Navbar() {
  return (
    <div className="sidenav">
        <a href="#upload"><img src={upload} />Upload</a>
        <a href="#edit"><img src={edit} />Edit</a>
        <a href="#generate"><img src={generate} />Generate</a>
    </div>
  );
}

export default Navbar;

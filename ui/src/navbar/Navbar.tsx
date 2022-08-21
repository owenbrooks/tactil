import React from 'react';
import './Navbar.css'
import upload from './icons/upload.svg'
import edit from './icons/edit.svg'
import generate from './icons/generate.svg'
import home from './icons/home.svg'
import scan from './icons/scan.svg'
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  return (
    <div className="sidenav">
      <NavItem to="/"><img src={home} alt="Home icon"/>Home</NavItem>
      <NavItem to="/scan"><img src={scan} style={{width: 85}} alt="Scan icon"/>Scan</NavItem>
      <NavItem to="/upload"><img src={upload} alt="Upload icon"/>Upload</NavItem>
      <NavItem to="/edit"><img src={edit} alt="Edit icon"/>Edit</NavItem>
      <NavItem to="/generate"><img src={generate} alt="Generate icon"/>Generate</NavItem>
    </div>
  );
}

type NavItemProps = {
  to: string,
  children: React.ReactNode;
}
function NavItem(props: NavItemProps) {
  const location = useLocation();
  
  const isSelected = location.pathname === props.to;

  return (
    <div className={'nav-item ' + (isSelected ? 'nav-item-selected' : '')}>
      <Link to={props.to}>{props.children}</Link>
    </div>
  )
}

export default Navbar;

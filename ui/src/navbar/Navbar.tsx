import React from 'react';
import './Navbar.css'
import upload from './upload.svg'
import edit from './edit.svg'
import generate from './generate.svg'
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  return (
    <div className="sidenav">
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

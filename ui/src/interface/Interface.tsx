import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './editor/Edit';
import { useState } from 'react';
import { BoxProperties } from '../api/api';

function Interface() {

  const [boxProperties, setBoxProperties] = useState<BoxProperties>();
  const [imagePath, setImagePath] = useState<string>();

  return (
      <Routes>
        <Route path="upload" element={<Upload setBoxProperties={setBoxProperties} setImagePath={setImagePath}/>} />
        <Route path="edit" element={<Edit boxProperties={boxProperties} setBoxProperties={setBoxProperties} imagePath={imagePath}/>} />
        <Route path="generate" element={<Generate boxProperties={boxProperties}/>} />
        <Route
            path="*"
            element={<Navigate to="/upload" replace />}
        />
      </Routes>
  );
}

export default Interface;

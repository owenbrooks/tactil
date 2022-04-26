import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './Edit';
import { useState } from 'react';
import { BoxProperties } from '../api';

function Interface() {

  const [boxProperties, setBoxProperties] = useState<BoxProperties>();

  return (
      <Routes>
        <Route path="upload" element={<Upload setBoxProperties={setBoxProperties} />} />
        <Route path="edit" element={<Edit boxProperties={boxProperties} setBoxProperties={setBoxProperties} />} />
        <Route path="generate" element={<Generate boxProperties={boxProperties}/>} />
        <Route
            path="*"
            element={<Navigate to="/upload" replace />}
        />
      </Routes>
  );
}

export default Interface;

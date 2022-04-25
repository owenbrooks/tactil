import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './Edit';
import { useState } from 'react';
import { BoxOutputs } from '../api';

function Interface() {

  const [boxOutputs, setBoxOutputs] = useState<BoxOutputs>();

  return (
      <Routes>
        <Route path="upload" element={<Upload setBoxOutputs={setBoxOutputs} />} />
        <Route path="edit" element={<Edit boxOutputs={boxOutputs} setBoxOutputs={setBoxOutputs} />} />
        <Route path="generate" element={<Generate boxOutputs={boxOutputs}/>} />
        <Route
            path="*"
            element={<Navigate to="/upload" replace />}
        />
      </Routes>
  );
}

export default Interface;

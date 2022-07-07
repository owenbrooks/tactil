import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './editor/Edit';
import { ImageInfo, VectorMap } from "../api/api";
import { useState } from 'react';

function Interface() {

  const [vectorMap, setVectorMap] = useState<VectorMap>();
  const [pcdImageInfo, setPcdImageInfo] = useState<ImageInfo>();

  return (
    <Routes>
      <Route path="upload" element={
        <Upload setVectorMap={setVectorMap} setPcdImageInfo={setPcdImageInfo}/>} />
      <Route path="edit" element={
        <Edit vectorMap={vectorMap} setVectorMap={setVectorMap} pcdImageInfo={pcdImageInfo}/>}
      />
      <Route path="generate" element={<Generate vectorMap={vectorMap} />} />
      <Route
        path="*"
        element={<Navigate to="/upload" replace />}
      />
    </Routes>
  );
}

export default Interface;

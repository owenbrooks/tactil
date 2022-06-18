import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './editor/Edit';
import { Dimensions, ImageInfo } from "../api/api";
import { useState } from 'react';
import { BoxProperties } from '../api/api';

function Interface() {

  const [boxProperties, setBoxProperties] = useState<BoxProperties>();
  const [pcdImageInfo, setPcdImageInfo] = useState<ImageInfo>();

  return (
    <Routes>
      <Route path="upload" element={
        <Upload setBoxProperties={setBoxProperties} setPcdImageInfo={setPcdImageInfo}/>} />
      <Route path="edit" element={
        <Edit boxProperties={boxProperties} setBoxProperties={setBoxProperties} pcdImageInfo={pcdImageInfo}/>}
      />
      <Route path="generate" element={<Generate boxProperties={boxProperties} />} />
      <Route
        path="*"
        element={<Navigate to="/upload" replace />}
      />
    </Routes>
  );
}

export default Interface;

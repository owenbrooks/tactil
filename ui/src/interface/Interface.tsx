import './Interface.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from './Upload';
import Generate from './Generate';
import Edit from './Edit';

function Interface() {

  return (
      <Routes>
        <Route path="upload" element={<Upload />} />
        <Route path="generate" element={<Generate />} />
        <Route path="edit" element={<Edit />} />
        <Route
            path="*"
            element={<Navigate to="/upload" replace />}
        />
      </Routes>
  );
}

export default Interface;

import React, { SyntheticEvent, useState } from 'react';
import './Interface.css'
import upload from '../navbar/upload.svg'
import { useDrag } from 'react-dnd'
const upload_url = "http://localhost:5000/upload"

function Interface() {
  const [selectedFile, setSelectedFile] = useState<File>();
  const [isFilePicked, setIsFilePicked] = useState(false);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files != null) {
      setSelectedFile(event.target.files[0]);
      setIsFilePicked(true);
    }
  };

  const handleSubmission = (event: SyntheticEvent) => {
    if (selectedFile != null) {
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      fetch(upload_url, {
        method: "POST",
        body: formData
      }).then((value: Response) => {
        console.log(value)
      });
    }
  };

  return (
    <div className="interface">
      <p>Choose a .pcd file to upload</p>
      <input type="file" name="file" onChange={changeHandler} />
      <div>
        <button onClick={handleSubmission}>Upload</button>
      </div>
      {/* <a href="#upload"><img src={upload} />Upload</a> */}
    </div>
  );
}

export default Interface;

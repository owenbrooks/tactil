import React, { SyntheticEvent, useState } from 'react';
import './Interface.css'
import upload from '../navbar/upload.svg'
import { useDrag } from 'react-dnd'
const upload_url = "http://localhost:5000/"

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
    console.log(event)
    if (selectedFile != null) {
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      console.log(formData)
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
      <input type="file" name="file" onChange={changeHandler} />
      <div>
        <button onClick={handleSubmission}>Submit</button>
      </div>
      {/* <a href="#upload"><img src={upload} />Upload</a> */}
    </div>
  );
}

export default Interface;

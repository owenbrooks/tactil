import React, { SyntheticEvent, useState } from 'react';
import './Interface.css'
import { useNavigate } from "react-router-dom";
import { ProcessReponse, postData } from '../api';
const upload_url = "http://localhost:5000/upload"
const process_url = "http://localhost:5000/process"


function Upload() {
    const [selectedFile, setSelectedFile] = useState<File>();
    const [isFilePicked, setIsFilePicked] = useState(false);
    const [uploadFinished, setUploadFinished] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files != null) {
            setSelectedFile(event.target.files[0]);
            setIsFilePicked(true);
        } else {
            setIsFilePicked(false);
        }
        setUploadFinished(false);
    };

    const handleSubmission = (event: SyntheticEvent) => {
        if (selectedFile != null) {
            const formData = new FormData();
            formData.append("file", selectedFile, selectedFile.name);
            setIsUploading(true);
            fetch(upload_url, {
                method: "POST",
                body: formData
            }).then((value: Response) => {
                console.log(value)
                setIsUploading(false);
                setUploadFinished(value.ok);
            });
        } else {
            console.error("No file selected.");
        }
    };

    const handleNext = (_: SyntheticEvent) => {
        if (selectedFile != null) {
            const data = { "filename": selectedFile.name };
            setIsProcessing(true);
            postData(process_url, data).then((response: ProcessReponse) => {
                console.log(response)
                setIsProcessing(false);
                navigate("/generate", { state: { "box_outputs": response["box_outputs"] } })
            });
        }
    }

    return (
        <div className="interface">
            <p>Choose a .pcd file to upload</p>
            <input type="file" name="file" onChange={changeHandler} />
            {(isFilePicked && !uploadFinished) && <div>
                <button onClick={handleSubmission}>Upload</button>
            </div>}
            {uploadFinished && <div>
                <button onClick={handleNext}>Next</button>
            </div>}
            {isUploading &&
                <div>
                    <p> Uploading... </p>
                    <div className='lds-dual-ring'></div>
                </div>}
            {isProcessing &&
                <div>
                    <p> Processing... </p>
                    <div className='lds-dual-ring'></div>
                </div>}
        </div>
    );
}

export default Upload;

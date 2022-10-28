import React, { SyntheticEvent, useState } from 'react';
import './Interface.css'
import { useNavigate } from "react-router-dom";
import { ProcessReponse, ImageInfo, VectorMap, deserializeVectorMap, postData, upload_url, process_url } from '../api/api';
const example_api_response = require('./example_api_response.json');

type UploadProps = {
    setVectorMap: React.Dispatch<React.SetStateAction<VectorMap | undefined>>,
    setPcdImageInfo: React.Dispatch<React.SetStateAction<ImageInfo | undefined>>,
}

function Upload(props: UploadProps) {
    const [selectedFile, setSelectedFile] = useState<File>();
    const [isFilePicked, setIsFilePicked] = useState(false);
    const [uploadFinished, setUploadFinished] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const isDevEnvironment = process.env.NODE_ENV === 'development';

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
                setIsUploading(false);
                setUploadFinished(value.ok);
            }).then(() => {
                if (selectedFile != null) {
                    const data = { "filename": selectedFile.name };
                    setIsProcessing(true);
                    postData(process_url, data).then((response: ProcessReponse) => {
                        setIsProcessing(false);
                        const vectorMap = deserializeVectorMap(response);
                        props.setVectorMap(vectorMap);
                        props.setPcdImageInfo(response.pcd_image_info);
                        navigate("/edit");
                    }).catch((error: any) => {
                        console.error(error);
                        alert("Error: Failed to process scan.");
                        setIsUploading(false);
                        setUploadFinished(false);
                        setIsProcessing(false);
                    });
                }
            }).catch((error: any) => {
                console.error(error);
                alert("Error: Failed to upload/process scan.");
                setIsUploading(false);
                setUploadFinished(false);
                setIsProcessing(false);
            });


        } else {
            console.error("No file selected.");
            alert("Error: No file selected.\nPlease select a file.")
            // Provide a test api response in dev mode
            if (isDevEnvironment) {
                const vectorMap = deserializeVectorMap(example_api_response);
                props.setVectorMap(vectorMap);
                props.setPcdImageInfo(example_api_response.pcd_image_info);
                navigate("/edit");
            }
        }
    };

    return (
        <>
            <div className='instruction-page'>
                <h1>Upload</h1>
                <div className="interface">
                    <div className='border-dashed border-black border-2 background-red underline'>
                        Upload file here
                    </div>
                    {(!isUploading && !isProcessing && !uploadFinished) &&
                        <><p>Choose a .pcd file to upload</p>
                            <input type="file" name="file" onChange={changeHandler} /></>}
                    {((isFilePicked || isDevEnvironment) && !isUploading && !isProcessing && !uploadFinished) && <div>
                        <button onClick={handleSubmission}>Upload</button>
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
            </div>
        </>
    );
}

export default Upload;

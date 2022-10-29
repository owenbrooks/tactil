import React, { SyntheticEvent, useEffect, useState } from 'react';
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
    const [isDragging, setDragging] = useState(false);

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

    // Drag and drop events
    function handleDragOver(e: any) {
        e.preventDefault();
    }
    function handleDrop(e: any) {
        e.preventDefault();
        console.log('droppped', e.dataTransfer.files)
        setDragging(false);
        if (e.dataTransfer.length !== 0) {
            setSelectedFile(e.dataTransfer.files[0]);
            setIsFilePicked(true);
        } else {
            setIsFilePicked(false);
        }
        setUploadFinished(false);
    }
    useEffect(() => {
        window.addEventListener("dragenter", function (e) {
            setDragging(true);
        });
        window.addEventListener("dragleave", function (e) {
            const target = e.target as HTMLDivElement;
            if (target !== undefined && target !== null) {
                if (target.id === 'drop-zone') {
                    setDragging(false);
                }
            }
        });
        // clean up handlers
        return () => {
            window.removeEventListener("dragenter", () => { });
            window.removeEventListener("dragleave", () => { });
        }
    }, []);

    const dropZoneHiddenStyle = { visibility: 'hidden', opacity: 0 };

    return (
        <>
            <div className='instruction-page'>
                <h1>Upload</h1>
                <div className="interface">
                    {/* Full page drop zone */}
                    <div id='drop-zone' style={isDragging ? {} : dropZoneHiddenStyle as any}
                        className='transition fixed top-0 left-0 z-[999999] w-full h-full bg-black/50'
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                    </div>
                    {(!isUploading && !isProcessing && !uploadFinished) &&
                        <div className='pointer-none grid grid-cols-1 w-full' >
                            <div className='w-full max-w-lg justify-self-center'>
                                <div className='box-border border-dashed w-full text-center font-bold border-gray-400 rounded-md border-2 p-4 '>
                                    <UploadIcon />
                                    <p className='m-4'>Drag and drop .pcd file here</p>
                                    <p className='m-4'>or</p>
                                    <input className='hidden' type="file" name="file" id="file-input" onChange={changeHandler} />
                                    <label htmlFor="file-input" className=' border-solid border-2 border-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:text-white text-lg bg-white cursor-pointer text-teal-600 font-bold py-2 px-4 rounded my-2 block' >Browse files</label>
                                </div>
                                {/* <button className='w-full border-none text-lg bg-teal-600 hover:bg-teal-700 cursor-pointer text-white font-bold py-2 px-4 rounded my-2' onClick={handleSubmission}>Upload</button> */}
                            </div>
                        </div>}
                    {((isFilePicked || isDevEnvironment) && !isUploading && !isProcessing && !uploadFinished) && <div>

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

function UploadIcon() {
    return <svg className='w-16 stroke-black fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 486.3 486.3">
        <g><path d="M395.5 135.8c-5.2-30.9-20.5-59.1-43.9-80.5-26-23.8-59.8-36.9-95-36.9-27.2 0-53.7 7.8-76.4 22.5-18.9 12.2-34.6 28.7-45.7 48.1-4.8-.9-9.8-1.4-14.8-1.4-42.5 0-77.1 34.6-77.1 77.1 0 5.5.6 10.8 1.6 16C16.7 200.7 0 232.9 0 267.2c0 27.7 10.3 54.6 29.1 75.9 19.3 21.8 44.8 34.7 72 36.2h86.8c7.5 0 13.5-6 13.5-13.5s-6-13.5-13.5-13.5h-85.6C61.4 349.8 27 310.9 27 267.1c0-28.3 15.2-54.7 39.7-69 5.7-3.3 8.1-10.2 5.9-16.4-2-5.4-3-11.1-3-17.2 0-27.6 22.5-50.1 50.1-50.1 5.9 0 11.7 1 17.1 3 6.6 2.4 13.9-.6 16.9-6.9 18.7-39.7 59.1-65.3 103-65.3 59 0 107.7 44.2 113.3 102.8.6 6.1 5.2 11 11.2 12 44.5 7.6 78.1 48.7 78.1 95.6 0 49.7-39.1 92.9-87.3 96.6h-73.7c-7.5 0-13.5 6-13.5 13.5s6 13.5 13.5 13.5h75.2c30.5-2.2 59-16.2 80.2-39.6 21.1-23.2 32.6-53 32.6-84-.1-56.1-38.4-106-90.8-119.8z" /><path d="M324.2 280c5.3-5.3 5.3-13.8 0-19.1l-71.5-71.5c-2.5-2.5-6-4-9.5-4s-7 1.4-9.5 4l-71.5 71.5c-5.3 5.3-5.3 13.8 0 19.1 2.6 2.6 6.1 4 9.5 4s6.9-1.3 9.5-4l48.5-48.5v222.9c0 7.5 6 13.5 13.5 13.5s13.5-6 13.5-13.5V231.5l48.5 48.5c5.2 5.3 13.7 5.3 19 0z" /></g>
    </svg>;
}

export default Upload;

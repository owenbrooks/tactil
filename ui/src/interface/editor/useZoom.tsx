import { useState } from "react"

export default function useZoom(defaultZoomLevel: number, maxZoom: number, minZoom: number, editDivRef: React.RefObject<HTMLDivElement>):
    [number, () => void, () => void, () => void] {

    const [zoomLevel, setZoomLevel] = useState(defaultZoomLevel);
    function startZoomListen() {
        if (editDivRef && editDivRef.current) {
            // Unregister our custom handleWheel function that prevents scrolling when mouse is over the edit div
            editDivRef.current.addEventListener('wheel', handleWheel, { passive: false })
        }
    }
    function stopZoomListen() {
        if (editDivRef && editDivRef.current) {
            // Register our custom handleWheel function to prevent scrolling when mouse is over the edit div
            editDivRef.current.removeEventListener('wheel', handleWheel, false)
        }
    }
    function handleWheel(this: HTMLDivElement, e: WheelEvent) {
        e.preventDefault() // stops from scrolling the rest of the page

        // Set the new zoom level based on amount scrolled
        // Specifically uses the functional update method rather than just setZoomLevel(newZoom),
        // since this avoids the issue of the state becoming stale. 
        // See https://stackoverflow.com/questions/55265255/react-usestate-hook-event-handler-using-initial-state 
        setZoomLevel(oldZoom => {
            const delta = e.deltaY * -0.0002;
            const proposedZoom = oldZoom + delta * oldZoom;
            let newZoom;
            if (proposedZoom < minZoom) {
                newZoom = minZoom;
            } else if (proposedZoom > maxZoom) {
                newZoom = maxZoom;
            } else {
                newZoom = proposedZoom;
            }
            return newZoom;
        });
    };

    function resetZoomLevel() {
        setZoomLevel(defaultZoomLevel);
    }
    return [zoomLevel, startZoomListen, stopZoomListen, resetZoomLevel];
}
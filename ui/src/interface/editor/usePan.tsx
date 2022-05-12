import { useState } from "react"
import { Coordinate } from "../../api/api";

export default function usePan(zoomLevel: number, mousePos: Coordinate): [Coordinate, () => void, () => void, (mousePixelCoord: Coordinate) => void, () => void] {
    const [savedPanOffset, setSavedPanOffset] = useState({ x: 0, y: 0 });
    const [livePanOffset, setLivePanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

    const combinedPanOffset = {
        x: livePanOffset.x + savedPanOffset.x,
        y: -livePanOffset.y - savedPanOffset.y, // negative because of reversed y coordinate frame
    };

    function startPanning() {
        setPanStartPos(mousePos);
        setIsPanning(true);
    }
    function stopPanning() {
        setIsPanning(false);
        setSavedPanOffset({
            x: livePanOffset.x + savedPanOffset.x,
            y: livePanOffset.y + savedPanOffset.y,
        });
        setLivePanOffset({
            x: 0, y: 0,
        });
    }
    function panHandleMouseMove(mousePixelCoord: Coordinate) {
        // the passed mousePixelCoord here will be more up to date than mousePos (haven't tested though)
        if (isPanning) {
            setLivePanOffset({ x: (mousePixelCoord.x - panStartPos.x) / zoomLevel, y: (mousePixelCoord.y - panStartPos.y) / zoomLevel });
        }
    }
    function resetPanOffset() {
        setSavedPanOffset({ x: 0, y: 0 });
    }
    return [combinedPanOffset, startPanning, stopPanning, panHandleMouseMove, resetPanOffset];
}
import { Coordinate, PIXEL_TO_WORLD_FACTOR } from "./api/api";

export function distance(pointA: Coordinate, pointB: Coordinate) {
    return Math.sqrt((pointA.x-pointB.x)**2 + (pointA.y - pointB.y)**2)
}

export function pixelToWorld(pixelCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
    const x = PIXEL_TO_WORLD_FACTOR * (pixelCoord.x - pixelOffset.x*zoomLevel) / zoomLevel;
    const y = PIXEL_TO_WORLD_FACTOR * (-pixelCoord.y - pixelOffset.y*zoomLevel) / zoomLevel;

    return {
        x: x,
        y: y,
    }
}

export function worldToPixel(worldCoord: Coordinate, pixelOffset: Coordinate, zoomLevel: number) {
    const x = worldCoord.x * zoomLevel / PIXEL_TO_WORLD_FACTOR + pixelOffset.x * zoomLevel;
    const y = worldCoord.y * zoomLevel / PIXEL_TO_WORLD_FACTOR + pixelOffset.y * zoomLevel;
    return {
        x: x,
        y: -y, // negative y since pixel coordinate system is reversed
    }
}
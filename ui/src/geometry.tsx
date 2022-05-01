import { Coordinate } from "./api/api";

export function distance(pointA: Coordinate, pointB: Coordinate) {
    return Math.sqrt((pointA.x-pointB.x)**2 + (pointA.y - pointB.y)**2)
}
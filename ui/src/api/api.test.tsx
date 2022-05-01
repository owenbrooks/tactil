import { boxParamsToGraph, graphToBoxParams } from './api';

test('converts from box params to graph and back', () => {
  const c = Math.cos(Math.PI/4);
  const s = Math.sin(Math.PI/4);
  const inputParams = {
    box_centers: [[0, 0, 0]] as unknown as [number, number, number][],
    box_extents: [[5, 0.1, 1]] as unknown as [number, number, number][],
    box_rotations: [[[c, -s, 0], [s, c, 0], [0, 0, 1]]] as unknown as [[number, number, number],[number, number, number],[number, number, number]][],

  }
  const graph = boxParamsToGraph(inputParams)
  const outputParams = graphToBoxParams(graph)
  console.log(inputParams.box_rotations, outputParams.box_rotations)
  expect(inputParams.box_centers[0].every((val, index) => val === outputParams.box_centers[0][index])).toBeTruthy()
  expect(inputParams.box_extents[0].every((val, index) => val === outputParams.box_extents[0][index])).toBeTruthy()
  expect(inputParams.box_rotations[0][0].every((val, index) => val === outputParams.box_rotations[0][0][index])).toBeTruthy()
  // Could test more thoroughly but it will do.
});

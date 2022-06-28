import { Coordinate, PIXEL_TO_WORLD_FACTOR } from '../../api/api';
import { worldToPixel } from '../../geometry';

type GraphViewProps = {
    nodes: Map<number, Coordinate>,
    edges: Map<number, [number, number]>,
    selectedNodes: number[], // list of nodeId's
    hoveredNodes: number[], // list of nodeId's
    nodeRadiusPx: number,
    zoomLevel: number
    combinedPanOffset: Coordinate,
};

function GraphView(props: GraphViewProps) {
    const { zoomLevel, nodes, edges, combinedPanOffset, selectedNodes, hoveredNodes, nodeRadiusPx } = props;

    return <>
        {/* Nodes (circles)*/}
        {[...nodes.entries()].map(([nodeId, node]) => {
            const pixelCoord = worldToPixel(node, combinedPanOffset, zoomLevel);
            const left = 'calc(' + pixelCoord.x + 'px + 50%)';
            const top = 'calc(' + pixelCoord.y + 'px + 50%';
            const isHovered = hoveredNodes.indexOf(nodeId) >= 0;
            const isSelected = selectedNodes.indexOf(nodeId) >= 0;
            const className = 'node' + (isHovered ? ' hovered' : '') + (isSelected ? ' selected' : '');
            return <div className={className} tabIndex={0} style={{ left: left, top: top, position: 'absolute', height: nodeRadiusPx * 2, width: nodeRadiusPx * 2 }} key={nodeId} ></div>
        })}
        {/* Edges (lines)*/}
        {[...edges.entries()].map(([edgeId, edge]) => {
            const nodeA = nodes.get(edge[0]);
            const nodeB = nodes.get(edge[1]);

            if (nodeA === undefined || nodeB === undefined) {
                console.log(edgeId, edge[0], edge[1])
                console.error("Mismatch between nodes and edges");
                return null; // early exit
            }

            const averagePos = {
                x: (nodeA.x + nodeB.x) / 2,
                y: (nodeA.y + nodeB.y) / 2
            };
            const averagePosPixel = worldToPixel(averagePos, combinedPanOffset, zoomLevel);
            const length = Math.sqrt((nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2) * zoomLevel / PIXEL_TO_WORLD_FACTOR;
            const thickness = 4;
            const angle = Math.atan2(-(nodeB.y - nodeA.y), (nodeB.x - nodeA.x)) * (180 / Math.PI); // negative because of reversed y coordinate frame
            return <div key={edgeId} className="edge" style={{
                padding: '0px',
                margin: '0px',
                height: thickness + 'px',
                width: length + 'px',
                backgroundColor: "black",
                lineHeight: '1px',
                position: 'absolute',
                left: "calc(" + averagePosPixel.x + "px + 50%)",
                top: "calc(" + averagePosPixel.y.toString() + "px + 50%)",
                // ['MozTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
                // ['WebkitTransform' as any]: 'rotate(' + -angle + 'deg); translate(-50%, -50%)',
                // ['MsTransform' as any]: 'rotate(' + -angle + 'deg) translate(-50%, -50%)',
                transform: "translate(-50%, -50%) rotate(" + angle + "deg) ",
            }}> </div>
        })}
        
    </>
}

export default GraphView;
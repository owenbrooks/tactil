import { PIXEL_TO_WORLD_FACTOR } from '../api/api';

type ScaleMarkerProps = {
    zoomLevel: number,
};

// Scale bar transitions between 2m, 5m, and 10m and other powers of 10.
// 0.01m, 0.02m, 0.05m, 0.1m, 0.2m, 0.5, 1m, 2m, 5m, 10m, 20m, 50m, 100m

function ScaleBar(props: ScaleMarkerProps) {
    const log = Math.log10(props.zoomLevel)-1; // subtract one to make reasonable default size
    const exactFraction = (10**(-log))/(10**(Math.floor(-log)))
    let roundedFraction = 1
    if (exactFraction < 1) {
        roundedFraction = 1;
    } else if (exactFraction >= 1 && exactFraction < 2) {
        roundedFraction = 2;
    } else if (exactFraction >= 2 && exactFraction < 5) {
        roundedFraction = 5;
    } 
    else if (exactFraction >= 5 && exactFraction < 10) {
        roundedFraction = 10;
    }
    const world_width = roundedFraction * 10**(Math.floor(-log));
    const scalebar_pixel_width = world_width / PIXEL_TO_WORLD_FACTOR * props.zoomLevel;

    const height = 20;
    const strokeThickness = 5;

    return (
        <div className='scale-marker' style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: height / 2, right: height / 2, width: 'auto', height: height }} >
                <svg style={{ overflow: 'visible', width: scalebar_pixel_width, height: height }}>
                    <line x1="0" y1="0" x2={scalebar_pixel_width} y2="0" stroke="#006462" strokeWidth={strokeThickness} />
                    <line x1="0" y1={-strokeThickness / 2} x2="0" y2={height} stroke="#006462" strokeWidth={strokeThickness} />
                </svg>
                <span style={{position: 'absolute', top: strokeThickness/2, right: strokeThickness, fontSize: height, color: '#006462'}}>
                    {world_width}m
                </span>
            </div>
        </div>
    );
}

export default ScaleBar;

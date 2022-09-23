import { useState } from "react";
import { Coordinate, ImageInfo } from "../../api/api";
import { worldToPixel } from "../../geometry";

type PcdImageProps = {
    imageInfo: ImageInfo,
    zoomLevel: number,
    panOffset: Coordinate,
}

function PcdImage(props: PcdImageProps) {
    const [hasImageError, setHasImageError] = useState(false);

    // calculate width and height for display of pcd image
    const imageDisplayDimensions = worldToPixel({
        x: props.imageInfo.world_dimensions.width,
        y: props.imageInfo.world_dimensions.height
    },
        { x: 0, y: 0 }, props.zoomLevel
    );
    // calculate offsets for image
    const worldOffset = worldToPixel({
        x: -(props.imageInfo.origin_camera.x),
        y: props.imageInfo.origin_camera.y,
    }, props.panOffset, props.zoomLevel);
    const totalOffset = {
        x: worldOffset.x - imageDisplayDimensions.x / 2,
        y: worldOffset.y + imageDisplayDimensions.y / 2
    }
    const image_left = 'calc(' + totalOffset.x + 'px + 50%)';
    const image_top = 'calc(' + totalOffset.y + 'px + 50%)';

    const handleImageError = () => {
        setHasImageError(true);
    }

    return (
        <>
            {/* <img src={"http://localhost:5000/./image_output/f9fff180-7302-4b2c-9e3f-541d6934cc75.png"} */}
            {!hasImageError && <img src={"http://localhost:5000/image_output/" + props.imageInfo.filename}
                onError={handleImageError}
                style={{
                    left: image_left,
                    top: image_top,
                    position: 'absolute',
                    width: imageDisplayDimensions.x,
                    height: imageDisplayDimensions.y,
                    pointerEvents: 'none',
                }} draggable={false}
                alt={"Room scan from bird's eye view"}
            />}
        </>
    )
}

export default PcdImage;
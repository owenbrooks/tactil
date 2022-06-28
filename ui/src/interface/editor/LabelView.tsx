import { Label } from "../../api/api";
import { worldToPixel } from "../../geometry";
import { ViewState } from "./Edit";

type LabelViewProps = {
    labels: Label[],
    viewState: ViewState,
    selectedLabels: number[],
    editingLabelIndex: number | undefined,
    labelsHandleClick: (labelIndex: number) => void,
    handleLabelChange: (labelIndex: number, newText: string) => void,
    labelsHandleMouseUp: () => void,
}

export default function LabelView(props: LabelViewProps) {
    const { labels, viewState, selectedLabels, editingLabelIndex, labelsHandleClick, handleLabelChange, labelsHandleMouseUp } = props;

    return <>{
        labels.map((label, index) => {
            const pixelCoord = worldToPixel(label.coord, viewState.panOffset, viewState.zoomLevel);
            const left = 'calc(' + pixelCoord.x + 'px + 50%)';
            const top = 'calc(' + pixelCoord.y + 'px + 50%';
            const pixelFontSize = -worldToPixel({ x: 0, y: 1 }, { x: 0, y: 0 }, viewState.zoomLevel).y; // convert constant real world size to pixel size at current zoom level

            if (index !== editingLabelIndex) {
                const isSelected = selectedLabels.indexOf(index) >= 0;
                const className = 'label' + (isSelected ? ' selected' : '');

                return (
                    <div key={index} className={className} onMouseDown={() => { labelsHandleClick(index) }}
                        style={{ left: left, top: top, position: 'absolute', fontSize: pixelFontSize }}>
                        {label.text}
                    </div>
                )
            } else {
                return (
                    <input
                        key={index}
                        value={label.text}
                        type="text"
                        onChange={(e) => handleLabelChange(index, e.target.value)}
                        onMouseUp={labelsHandleMouseUp}
                        style={{ left: left, top: top, position: 'absolute', fontSize: pixelFontSize }}
                    />
                )
            }
        })
    }</>;
}
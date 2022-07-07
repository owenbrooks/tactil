import { useState } from "react";
import { Coordinate, Graph } from "../../api/api";
import { ViewState } from "./Edit";
import { useDrag } from "./useDrag";

export default function useLabels(graph: Graph,
    setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void, mousePos: Coordinate, viewState: ViewState) {
    const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
    const [editingLabelIndex, setEditingLabelIndex] = useState<number | undefined>();

    const { liveDragOffsetWorld, isDragging, startDragging, stopDragging } = useDrag(mousePos, viewState);

    // add drag offset to label coordinates for display
    const labelsWithDragOffset = graph.labels.map((label, index) => {
        const isSelected = selectedLabels.indexOf(index) >= 0;
        if (liveDragOffsetWorld == null || !isSelected) {
            return label;
        } else {
            const newCoord = {
                x: label.coord.x + liveDragOffsetWorld.x,
                y: label.coord.y + liveDragOffsetWorld.y,
            };
            return {
                id: label.id,
                text: label.text,
                coord: newCoord,
            }
        }
    });

    function deselectAllLabels() {
        setSelectedLabels([]);
        stopEditingLabel();
    }

    function selectAllLabels() {
        let allLabelIndices = [];
        for (let i = 0; i < graph.labels.length; i++) {
            allLabelIndices.push(i);
        }
        setSelectedLabels(allLabelIndices);
    }

    function stopEditingLabel() {
        if (editingLabelIndex !== undefined) {
            setEditingLabelIndex(undefined);
            setSelectedLabels([]);
        }
    }

    function labelsHandleClick(labelIndex: number) {
        const isCurrentlySelected = selectedLabels.indexOf(labelIndex) >= 0;

        if (isCurrentlySelected) {
            // start editing that label
            setEditingLabelIndex(labelIndex);
        }
        setSelectedLabels([labelIndex]); // deselect all other nodes. TODO: enable shift-select to select multiple

        if (!isCurrentlySelected && labelIndex !== editingLabelIndex) {
            startDragging();
        }

    }

    function labelsHandleMouseUp() {
        if (isDragging) {
            setGraph({
                ...graph,
                labels: labelsWithDragOffset,
            });
        }
        stopDragging();
    }

    function handleLabelChange(labelIndex: number, newText: string) {
        const newLabel = {
            ...graph.labels[labelIndex],
            text: newText,
        };
        const newLabels = [...graph.labels];
        newLabels[labelIndex] = newLabel;
        setGraph({ ...graph, labels: newLabels });
    }

    return { labelsWithDragOffset, selectedLabels, editingLabelIndex, selectAllLabels, deselectAllLabels, labelsHandleClick, handleLabelChange, stopEditingLabel, labelsHandleMouseUp };
}
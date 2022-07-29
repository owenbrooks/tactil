import React, { useState } from "react";
import { Alphabet, Graph, Label } from "../../api/api";

// Unicode Braille conversion adapted from https://stackoverflow.com/questions/69756010/convert-string-to-braille
let map: any = " A1B'K2L@CIF/MSP\"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)=".split("").reduce((o, n, i) => {
    return ((o as any)[n] = "⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿"[i],
        (o as any)[n.toLowerCase()] = (o as any)[n], o);
}, {});
function toBraille(string: string) {
    return string.split("").map(c => map[c]).join("");
}

type AddLabelProps = {
    graph: Graph,
    setGraph: (newPresent: Graph, checkpoint?: boolean | undefined) => void,
}

export default function AddLabel(props: AddLabelProps) {
    const [labelText, setLabelText] = useState("");
    const { graph, setGraph } = props;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setLabelText(e.target.value)
    }

    function addText() {
        addLabel(labelText, false);
    }

    function addBraille() {
        // convert to braille before adding
        addLabel(toBraille(labelText), true);
    }

    function addLabel(finalText: string, useBraille: boolean) {
        if (finalText.length > 0) {
            const newLabel: Label = {
                id: 1, // TODO: fix id
                text: finalText,
                coord: { x: 0.0, y: 0.0 },
                alphabet: useBraille ? Alphabet.Braille : Alphabet.Regular,
                size: 12, // default size
            }
            setGraph({ nodes: graph.nodes, edges: graph.edges, labels: [...graph.labels, newLabel] });
            setLabelText("");
        }
    }

    return (<>
        <input onChange={handleChange} value={labelText}></input><br />
        <button onClick={addText}>Add as text</button>
        <button onClick={addBraille}>Add as braille</button>
    </>);
}
import { IDataFrame, Series } from "data-forge";
import React, { useEffect, useState } from "react"

export default function Table({selectionDf, playback}: {selectionDf: IDataFrame, playback: number}) {
    const [selectionArray, setSelectionArray] = useState<any[][]>();
    const [rowIdx, setRowIdx] = useState(0);
    const [startIdx, setStartIdx] = useState(0);
    const [endIdx, setEndIdx] = useState(1);

    const includeColumns = [
        "EventID", "EventType", "SourceLocation", //"EditType", 
        "InsertText", "DeleteText", "ClientTimestamp","X-Compilable", "X-Metadata"
    ]

    useEffect(() => {
        if (selectionDf == null) return;
        const tempDf = selectionDf.withSeries("FileIndex", new Series([...Array(selectionDf.count()).keys()]))
        setSelectionArray(tempDf.toArray())
    }, [selectionDf])

    useEffect(() => {
        if (selectionArray) {
            const rowsOutside = 5
            if (playback < rowsOutside) {
                setStartIdx(0)
                setEndIdx(Math.min(2*rowsOutside+1 , selectionArray.length))
            } else if (playback > selectionArray.length - rowsOutside - 1) {
                setStartIdx(Math.max(0, selectionArray.length - (2*rowsOutside+1)))
                setEndIdx(selectionArray.length)
            } else {
                setStartIdx(playback as number - rowsOutside);
                setEndIdx(playback as number + rowsOutside + 1)
            }
        }
    }, [playback, selectionArray])

    const shorten = (text: string) => {
        if (text && text.length > 10) {
            return text.slice(0, 10) + "..."
        }
        return text
    }

    return (
        <div className="w-full h-full">
            <table className="w-full text-sm table-fixed">
                <thead className="font-bold">
                    <tr>
                        {includeColumns.map(colName => <td key={colName}>{colName}</td>)}
                    </tr>
                </thead>
                {selectionArray && <tbody>
                    {selectionArray.slice(startIdx, endIdx).map(row => 
                        <tr key={row["EventID"]} className={row["FileIndex"] == playback ? "bg-cyan-300": ""}>
                            {includeColumns.map(colName => <td key={colName}>{shorten(row[colName])}</td>)}
                        </tr>)}
                </tbody>}
            </table>
        </div>
    )
}
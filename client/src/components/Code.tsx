import MonacoEditor from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';
import *  as monaco from 'monaco-editor';

import "../css/code.css"
import React from 'react';

export default function Code({codeStates, playback, task, edits, hoverHighlights, editorRef, height="65vh"}) {
    const [currentCodeState, setCurrentCodeState] = useState("") 

    // const editorRef = useRef(null);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
    } 

    useEffect(() => {
    if (codeStates.length > 0) {
        setCurrentCodeState(codeStates[playback])
    }
    }, [codeStates, playback])

    useEffect(() => {
        if (edits && editorRef.current != null) {
            const lastEdit = edits.current[playback];
            const { lineNumber, column } = editorRef.current.getModel().getPositionAt(lastEdit.location);
            const endLocation = editorRef.current.getModel().getPositionAt(lastEdit.location + lastEdit.insertText.length);

            // console.log(lastEdit.location)
            // console.log(lastEdit.location + lastEdit.insertText.length)
            // console.log(lineNumber, column, endLocation["lineNumber"], endLocation["column"])

            const codeHighlights: Array<any> = []

            // console.log(hoverHighlights)

            hoverHighlights.forEach(highlight => {
                codeHighlights.push({
                    range: new monaco.Range(
                        highlight.startLineNumber,
                        highlight.startColumn,
                        highlight.endLineNumber,
                        highlight.endColumn
                    ),
                    options: {
                        isWholeLine: false,
                        className: "highlightHovered",
                        zIndex: 2
                    }
                })
            });
            const insertEvent = {
                range: new monaco.Range(
                    lineNumber,
                    column,
                    endLocation["lineNumber"],
                    endLocation["column"]
                ),
                options: {
                    isWholeLine: false,
                    className: "insert",
                    zIndex: 1
                }
            }
            const deleteEvent = {
                range: new monaco.Range(
                    lineNumber,
                    column - 1,
                    lineNumber,
                    column
                ),
                options: {
                    isWholeLine: false,
                    className: "delete"
                }
            }
            const highlightRow = {
                range: new monaco.Range(
                    lineNumber,
                    0,
                    lineNumber,
                    0
                ),
                options: {
                    isWholeLine: true,
                    className: "hightlightRow",
                    marginClassName: "hightlightRow"
                }
            };
            const editEvent = lastEdit.insertText.length > 0 ? insertEvent : deleteEvent;
    
            editorRef.current.setValue(currentCodeState);
            if (hoverHighlights.length == 0) { // || Math.abs(hoverHighlights[0].startLineNumber - lineNumber) < 18) {
                editorRef.current.revealPositionInCenter({ lineNumber: lineNumber, column: column });
            } else {
                editorRef.current.revealPositionInCenter({ lineNumber: hoverHighlights[0].startLineNumber, column: hoverHighlights[0].startColumn });
            }
    
            const combinedHighlights = codeHighlights.concat([highlightRow, editEvent]);
            editorRef.current.deltaDecorations([], combinedHighlights);
        }
    }, [currentCodeState, hoverHighlights])

    var options = {
        automaticLayout: true,
        readOnly: true,
        minimap: { enabled: false },
        colorDecorators: true,
    }

    return (
        <div className="block min-w-full h-fit overflow-none border-solid border-2 border-gray-200 rounded-sm p-2 z-40">
            <div className="h-full w-full">
                <MonacoEditor
                    height={height}
                    defaultLanguage='python'
                    value={currentCodeState}
                    options={options}
                    onMount={handleEditorDidMount}
                />
            </div>
        </div>
    )

}
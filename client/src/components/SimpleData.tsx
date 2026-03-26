import { useEffect, useState, useRef } from "react";
import React from "react";
import { DataFrame, IDataFrame } from "data-forge";
import { parse } from 'papaparse';

import LeftHeader from "./LeftHeader";
import ReplayPanel from "./ReplayPanel";
import Code from "./Code";
import { Edit, CodeHighlight } from "../utils/types";


export default function SimpleData() {
    const [subject, setSubject] = useState<string | null>("");
    const [subjectList, setSubjectList] = useState<string[]>(['', 'test1', 'test2']);

    const [assignment, setAssignment] = useState<string | null>("");
    const [assignmentList, setAssignmentList] = useState<string[]>([]);

    const [task, setTask] = useState<string | null>("");
    const [taskList, setTaskList] = useState<string[]>([]);

    const [playback, setPlayback] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [estimatedLoadTime, setEstimatedLoadTime] = useState(null)

    const cachedSubjects = useRef({});
    const [filteredFile, setFilteredFile]  = useState<IDataFrame>();

    const [codeStates, setCodeStates] = useState<string[]>([]);
    const edits = useRef<Edit[]>([]);

    const [selectionDf, setSelectionDf] = useState<IDataFrame>();

    const [ hoverHighlights, setHoverHighlights ] = useState<Array<CodeHighlight>>([])

    const editorRef = useRef(null);

    const codeProcessRef = useRef(null);

    const [ play, setPlay ] = useState<boolean>(false)
    const [ replayIdx, setReplayIdx] = useState(null)
    const [ timeoutID, setTimeoutID] = useState(null)

    const dynamicTypingFunction = (header: string) : boolean => {
        if (header == "DeleteText" || header == "InsertText"){
            return false;
        } else {
            return true;
        }
    }
    
    const handleFileChange = async (event) => {
        const csvConfig = {
            delimiter: ",",
            header: true,
            dynamicTyping: dynamicTypingFunction,
            skipEmptyLines: true,
        }
        
        const file = event.target.files[0];
        setEstimatedLoadTime(Math.floor(file.size * 1.4 / 10000000))
        setLoading(true)
        const data = await file.text().then(data => parse(data, csvConfig));

        const df = new DataFrame(data.data)
        const editsDf = df.where(row => row.EventType == "File.Edit" || row.EventType == "X-FileInit")
        setFilteredFile(editsDf);
        setLoading(false)
        setEstimatedLoadTime(null)
    };


    useEffect(() => {
        if (filteredFile != null && filteredFile != undefined) {
            cacheStudentAssignments();
            // console.log("setting subject list")
            setSubjectList(Object.keys(cachedSubjects.current));
        }
    }, [filteredFile]);
    
    useEffect(() => {
        if (filteredFile != null && filteredFile != undefined) {
            // console.log("setting subject")
            setSubject(subjectList[0]);
        }
    }, [subjectList])

    useEffect(() => {
        if (filteredFile != null && subject != "") {
            // console.log("setting assignment list")
            setAssignmentList(Object.keys(cachedSubjects.current[subject]))
            // console.log("setting assignment")
            let oldAssign = assignment;
            setAssignment(Object.keys(cachedSubjects.current[subject])[0])
            if (oldAssign == Object.keys(cachedSubjects.current[subject])[0]) {
                changeTask()
            }
        }
    }, [subject])
    
    const changeTask = () => {
        if (filteredFile != null && subject != "" && assignment != "") {
            let oldTask = task;

            // console.log("setting task list")
            setTaskList(Object.keys(cachedSubjects.current[subject][assignment]))
            // console.log("setting task")
            setTask(Object.keys(cachedSubjects.current[subject][assignment])[0])
            
            if (subject != "" && assignment != "" && oldTask == Object.keys(cachedSubjects.current[subject][assignment])[0]) {
                onChangeTask();
            }
        }
    }

    useEffect(() => {
        changeTask();
    }, [assignment])

    const onChangeTask = () => {
        if (subject == null || subject == "") return
        if (assignment == null) return
        if (task == null) return

        codeProcessRef.current = null
        setPlayback(0)
        extractStudentData()
    }

    useEffect(() => {
        onChangeTask()
    }, [task])


    const extractStudentData = () => {
        if (subject == null || subject == "") return

        const selection = cachedSubjects.current[subject][assignment][task].resetIndex();
        setSelectionDf(selection);

        let state = "";
        setCodeStates([])
        let tempCodeStates: string[] = [];
        edits.current = [];

        const startTime = Date.now();

        selection.forEach((row: any, treeNumber: number) => {
            // console.log("State " + treeNumber)
            let location = row.SourceLocation;
            // console.log(`Compilable: ${row['X-Compilable']}`)
            let ogStartTime = Date.now()
            // let startTime = Date.now()
            //------------------------------------------------------------
            // Update the code reconstruction
            //------------------------------------------------------------
            let insertText = row.InsertText != null ? String(row.InsertText) : "";
            let deleteText = row.DeleteText != null ? String(row.DeleteText) : "";
            state = state.slice(0, location) + insertText + state.slice(location + deleteText.length);

            tempCodeStates.push(state);
            setCodeStates(tempCodeStates);
            // console.log(codeStates);
            edits.current.push(new Edit(location, insertText, deleteText));
            
        });
        console.log(`Parsed states in ${Date.now()-startTime} ms`)
    }




    const cacheStudentAssignments = () => {
        if (filteredFile == null) return
        // this.cachedSubjects = {};

        // cache every student ID, but don"t fill anything in
        const students = filteredFile.groupBy(row => row.SubjectID);

        cachesubjectIds(students);

        // go through every student and cache their assignments
        students.forEach(student => {
            const assignments = student.groupBy(row => row.AssignmentID);
            cacheAssignmentIds(assignments);

            // go through every task and cache the df-window for that task
            //  attaching it to the respective student-assignment
            assignments.forEach(assignment => {
                const tasks = assignment.groupBy(row => row.CodeStateSection);
                cacheTasks(tasks);
            });
        });
    };

    const cachesubjectIds = (students) => {
        const subjectIds = students
            .select(group => group.first().SubjectID)
            .inflate()
            .toArray();


        subjectIds.forEach(subjectId => cachedSubjects.current[subjectId] = {});
        console.log(cachedSubjects.current)
    }

    const cacheAssignmentIds = (assignments) => {
        const assignmentIds = assignments
            .select(group => ({
                subjectId: group.first().SubjectID,
                assignmentId: group.first().AssignmentID,
            }))
            .inflate()
            .toArray();

        assignmentIds.forEach(assignment => {
            cachedSubjects.current[assignment.subjectId][assignment.assignmentId] = {}
        });
    }

    const cacheTasks = (tasks) => {
        tasks.forEach(task => {
            const content = task.content.pairs[0][1];
            const subjectId = content.SubjectID;
            const assignmentId = content.AssignmentID;
            const taskId = content.CodeStateSection;

            cachedSubjects.current[subjectId][assignmentId][taskId] = task;
        });
    }

    const incrementPlayback = () => {
        if (playback < codeStates.length - 1) {
            setPlayback(playback + 1);
        }
    }

    const incrementSkipPlayback = () => {
        if (playback < codeStates.length - 10) {
            setPlayback(playback + 10);
        } else if (playback < codeStates.length - 1) {
            setPlayback(codeStates.length - 1)
        }
    }

    const decrementPlayback = () => {
        if (playback > 0) {
            setPlayback(playback - 1);
        }
    }

    
    const decrementSkipPlayback = () => {
        if (playback > 10) {
            setPlayback(playback - 10);
        } else if (playback > 0) {
            setPlayback(0)
        }
    }

    function togglePlay() {
        let newPlay = !play
        
        clearTimeout(timeoutID)
        setPlay(!play);
        setReplayIdx(playback + 1)
        if (newPlay) incrementPlayback()
    }
    
    useEffect(() => {
            console.log(`${playback} : ${replayIdx}`)
            if (playback != replayIdx) { 
                console.log("clearing")
                clearTimeout(timeoutID);
            }
            console.log(play)
        
    
            if (!play) return
    
            if (playback < selectionDf.count() - 1) {
                let delay = selectionDf.at(playback+1).ClientTimestamp - selectionDf.at(playback).ClientTimestamp;
                delay = delay/10;
                if (delay < 1000/60) {
                  delay = 1000/60;
                } else if (delay > 4000) {
                  delay = 4000;
                }
                console.log(delay);
                setTimeoutID(setTimeout(() => { tick() }, delay));
            }
        }, [playback])
    
        function tick() {
            incrementPlayback()
            setReplayIdx(playback+1)
        }
    

    const handleKeyPress = (e) => {
        // console.log(e)
        if (((e.key == 'f' && !e.ctrlKey) || e.key === 'ArrowRight') && !(e.target.type == "textarea")) {
            incrementPlayback()
        }
        else if ((e.key == 'd' || e.key === "ArrowLeft") && !(e.target.type == "textarea")) {
            decrementPlayback()
        }
        else if ((e.key == "F" && !e.ctrlKey) && !(e.target.type == "textarea")) {
            incrementSkipPlayback()
        } 
        else if ((e.key == "D") && !(e.target.type == "textarea")) {
            decrementSkipPlayback()
        }
        else if ((e.key == " ") && !(e.target.type == "textarea")) {
            togglePlay()
        }
    }


    return (
        <div 
            className="flex w-full h-screen space-x-4 absolute left-0 top-0"
            onKeyDown={e => handleKeyPress(e)}
            tabIndex={0}
        >  
            <div className="flex flex-col pl-8 pt-8 pb-8 h-full md:block w-[40vw] 3xl:max-w-[700px]">
                <LeftHeader
                    subjectList={subjectList}
                    subject={subject}
                    onSubjectChange={setSubject}
                    assignmentList={assignmentList}
                    assignment={assignment}
                    onAssignmentChange={setAssignment}
                    taskList={taskList}
                    task={task}
                    onTaskChange={setTask}
                    playback={playback}
                    onPlaybackChange={setPlayback}
                    handleFileChange={handleFileChange}
                    maxPlayback={codeStates.length}
                ></LeftHeader>
                <ReplayPanel
                    play={play}
                    togglePlay={togglePlay}
                ></ReplayPanel>
            </div>
            <div className="3xl:flex w-full items-start m-4 pr-4 pl-0 h-screen flex-wrap">
                <Code
                    codeStates={codeStates}
                    playback={playback}
                    task={task}
                    edits={edits}
                    hoverHighlights={hoverHighlights}
                    editorRef={editorRef}
                    height={"90vh"}
                ></Code>      
            </div>
        </div>
    )
}
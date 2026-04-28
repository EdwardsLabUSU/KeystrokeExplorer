import { useEffect, useState, useRef } from "react";
import React from "react";
import { DataFrame, IDataFrame } from "data-forge";
import { parse } from 'papaparse';

import { convertSqliteToDataFrame } from "../utils/sqliteToProgSnap2";
import LeftHeader from "./LeftHeader";
import RightOuterLayer from "./RightOuterLayer";
import Code from "./Code";
import { Node, getHeight, getSize } from "../utils/Node";

import { AstBuilder, AstNode, AstGenerator } from "../ast";
import { TemporalHierarchy } from "../temporalHierarchy";
import { json } from "d3";
import { Edit, CodeHighlight } from "../utils/types";


export default function Data() {
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

    const [precompiledTrees, setPrecompiledTrees] = useState<Array<Node>>(undefined)
    const [prunedTrees, setPrunedTrees] = useState<Array<Node>>([])
    // TODO parse errors
    const [astParseErrors, setAstParseErrors] = useState<Array<string>>([])

    const [ hoverHighlights, setHoverHighlights ] = useState<Array<CodeHighlight>>([])

    const temporalHierarchy = useRef<TemporalHierarchy>()

    const abortController = useRef(new AbortController());

    const [ tid2Node, setTid2Node ] = useState({})

    const [treeSizes, setTreeSizes] = useState<Array<number>>([]);
    const [treeHeights, setTreeHeights] = useState<Array<number>>([]);
    const [ptreeSizes, setPTreeSizes] = useState<Array<number>>([]);
    const [ptreeHeights, setPTreeHeights] = useState<Array<number>>([]);

    const editorRef = useRef(null);

    const [fetchSuccess, setFetchSuccess] = useState(true);

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
        const file = event.target.files[0];
        setLoading(true)

        setSubject("")
        setSubjectList([])
        setAssignment("")
        setAssignmentList([])
        setTask("")
        setTaskList([])
        cachedSubjects.current = {}
        setFilteredFile(undefined)
        setCodeStates([])
        edits.current = []
        setSelectionDf(undefined)

        

        let editsDf: IDataFrame;
        if (file.name.endsWith(".sqlite") || file.name.endsWith(".db")) {
            editsDf = await handleSQLiteFileChange(file);
        } else {
            editsDf = await handleCSVFileChange(file);
        }
        console.log(editsDf)
        setFilteredFile(editsDf);
        setLoading(false)
        setEstimatedLoadTime(null)

        
    };

    const handleCSVFileChange = async (file) => {
        const csvConfig = {
            delimiter: ",",
            header: true,
            dynamicTyping: dynamicTypingFunction,
            skipEmptyLines: true,
        }
        setEstimatedLoadTime(Math.floor(file.size * 1.4 / 10000000))
        const data = await file.text().then(data => parse(data, csvConfig));
        const df = new DataFrame(data.data)
        const editsDf = df.where(row => row.EventType == "File.Edit" || row.EventType == "X-FileInit")
        return editsDf;
    };

    const handleSQLiteFileChange = async (file) => {
        const editsDf = await convertSqliteToDataFrame(file, "assignment_0", "student");
        return editsDf;
    };

    useEffect(() => {
        AstBuilder.setup()
        temporalHierarchy.current = new TemporalHierarchy()
    }, [])

    useEffect(() => {
        if (filteredFile != null && filteredFile != undefined) {
            cacheStudentAssignments();
            // console.log("setting subject list")
            setSubjectList(Object.keys(cachedSubjects.current));
        }
    }, [filteredFile]);
    
    useEffect(() => {
        if (filteredFile != null && filteredFile != undefined && subjectList.length > 0) {
            // console.log("setting subject")
            setSubject(subjectList[0]);
        }
    }, [subjectList])

    useEffect(() => {
        if (filteredFile != null && subject != "") {
            console.log(subject)
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

        abortFetch()
        codeProcessRef.current = null
        setPrecompiledTrees([])
        setTreeHeights([])
        setTreeSizes([])
        setTid2Node({})
        setPlayback(0)
        extractStudentData()
    }

    useEffect(() => {
        onChangeTask()
    }, [task])

    useEffect(() => {
        if (precompiledTrees != undefined && precompiledTrees.length > 0) {
            calcTreeStats(precompiledTrees)
        }
    }, [precompiledTrees])

    useEffect(() => {
        if (prunedTrees != undefined && prunedTrees.length > 0) {
            pcalcTreeStats(prunedTrees)
        }
    }, [prunedTrees])

    const extractStudentData = () => {
        if (subject == null || subject == "") return

        const selection = cachedSubjects.current[subject][assignment][task].resetIndex();
        fetchTrees(selection);
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

    const abortFetch = () => {
        abortController.current.abort();
        console.log("aborting fetch")
        abortController.current = new AbortController()
    }

    const fetchTrees = async (selection: IDataFrame) => {
        setFetchSuccess(true)
        // setPrecompiledTrees(undefined)
        const startTime = Date.now();
        console.log("Fetching trees")
        const postData = JSON.stringify({ data: selection.toCSV() });
        const signal = abortController.current.signal;
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/buildTrees`, {
                method: "post",
                headers: {
                  'Content-type':'text/csv',   
                  'Accept-Encoding':'gzip'
                },
                body: postData,
                signal,
              })
              .then(async result => {
                    console.log(result.ok)
                    if (!result.ok) {
                        throw new Error("Something went wrong");
                    }
                    const text = await result.text();
                    console.log(text)
                    const parsed = JSON.parse(text);
                    return parsed;
                })
                .then(trees => {
                    const key = Object.keys(trees)[0]
                    setPrecompiledTrees(trees[key])
                    makeTid2Node(trees[key])
                    pruneTrees(trees[key])
                })  
            console.log(`Finished fetch in ${Date.now()-startTime} ms`)    
        } catch ({ name, message }) {
            if (name != "AbortError") {
                setPrecompiledTrees(undefined)
                setFetchSuccess(false)
            }
        }
    }

    const makeTid2Node = async (trees) => {
        let dict = {}
        let state = 0; 
        console.log(trees)
        for (const node of trees) {
            dict = makeTid2NodeRecursive(node, dict, state)
            state ++;
        }
        setTid2Node(dict)
    }

    const makeTid2NodeRecursive = (node, dict, state) => {
        if (node.children != undefined && node.children.length > 0) {
            for (let i = 0; i < node.children.length; i++) {
                dict = makeTid2NodeRecursive(node.children.at(i), dict, state)
            }
        } 
        dict[node.id] = {...node, "state": state}
        return dict
    }

    const pruneTrees = async (trees) => {
        const startTime = Date.now();

        if (trees.length == 0) {
            return;
        }
        const pruned = []
        for (const node of trees) {
            const copyNode = JSON.parse(JSON.stringify(node))
            pruneRecursive(copyNode)
            pruned.push(copyNode)
        }
        setPrunedTrees(pruned)
        console.log(pruned)
        console.log(`Finished pruning in ${Date.now()-startTime} ms`)
    }

    const pruneRecursive = (node : Node) => {
        if (node.children == undefined || node.children.length == 0) return;
        for (let i = 0; i < node.children.length; i++) {
            pruneRecursive(node.children.at(i))
        }
        for (let i = 0; i < node.children.length; i++) {
            const child : Node = node.children.at(i) 
            if (child.children.length == 1 && !Object.hasOwn(child, "childrenChanged") && !Object.hasOwn(child, "newChildrenChanged")) {
                node.children[i] = child.children.at(0)
            }
        }
    }
    // useEffect(() => {
    //     console.log("tree sizes changed")
    //     console.log(treeSizes)
    //     // if (treeSizes != undefined && treeSizes.length > 0) {
    //     //     console.log("showing chart")
    //     //     setShowChart(true);
    //     // }
    // }, [treeSizes])

    const calcTreeStats = (trees) => {
        let sizes = []
        let heights = []
        for (const node of trees) {
            sizes.push(getSize(node))
            heights.push(getHeight(node))
        }
        setTreeHeights(heights);
        setTreeSizes(sizes);
        // console.log("tree sizes", sizes)
        // console.log("tree heights", heights)
    }

    const pcalcTreeStats = (trees) => {
        let sizes = []
        let heights = []
        for (const node of trees) {
            sizes.push(getSize(node))
            heights.push(getHeight(node))
        }
        setPTreeHeights(heights);
        setPTreeSizes(sizes);

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

    const nextDerivedState = () => {
        let tempState = playback
        while (tempState < codeStates.length - 2) {
            tempState++
            if (precompiledTrees.at(tempState).derived) {
                setPlayback(tempState)
                return;
            }
        }
        setPlayback(codeStates.length - 1)
    }

    const lastDerivedState = () => {
        let tempState = playback
        while (tempState > 0) {
            tempState--
            if (precompiledTrees.at(tempState).derived) {
                setPlayback(tempState)
                return;
            }
        }
        setPlayback(0)
    }

    function togglePlay() {
        let newPlay = !play
        
        clearTimeout(timeoutID)
        setPlay(!play);
        setReplayIdx(playback + 1)
        if (newPlay) incrementPlayback()
    }


    useEffect(() => {
        // console.log(`${playback} : ${replayIdx}`)
        if (playback != replayIdx) { 
            // console.log("clearing")
            clearTimeout(timeoutID);
        }
        // console.log(play)
    

        if (!play) return

        if (playback < selectionDf.count() - 1) {
            let delay = selectionDf.at(playback+1).ClientTimestamp - selectionDf.at(playback).ClientTimestamp;
            delay = delay/10;
            if (delay < 1000/60) {
              delay = 1000/60;
            } else if (delay > 5000) {
              delay = 5000;
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
        if (e.key == 'r') {
            nextDerivedState()
        }
        if (e.key == "e") {
            lastDerivedState()
        }
        
    }


    return (
        <div 
            className="flex w-full h-screen space-x-4 absolute left-0 top-0"
            onKeyDown={e => handleKeyPress(e)}
            tabIndex={0}
        >
            {loading && 
            <div className="z-50"> 
                <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                    <svg aria-hidden="true" className="content-center w-32 h-32 mr-2 text-gray-200 animate-spin fill-blue-600"
                        viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor" />
                        <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill" />
                    </svg>
                </div>
                <div role="status" className="absolute -translate-x-1/2 -translate-y-2/3 left-1/2 top-2/3"> 
                    <h2 className="text-4xl font-med"> Estimated Load: {estimatedLoadTime} seconds </h2>
                </div>
            </div>}
                
            <div className="flex flex-col p-8 h-full md:block w-[40vw] 3xl:max-w-[700px]">
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
                <Code
                    codeStates={codeStates}
                    playback={playback}
                    task={task}
                    edits={edits}
                    hoverHighlights={hoverHighlights}
                    editorRef={editorRef}
                    ></Code>
            </div>
            <div className="3xl:flex w-full items-start p-4 pr-8 pl-0 h-screen flex-wrap">
                <RightOuterLayer
                    precompiledTrees={precompiledTrees}
                    prunedTrees={prunedTrees}
                    selectionDf={selectionDf}
                    playback={playback}
                    setPlayback={setPlayback}
                    codeStates={codeStates}
                    fetchSuccess={fetchSuccess}
                    treeSizes={treeSizes}
                    treeHeights={treeHeights}
                    ptreeHeights={ptreeHeights}
                    ptreeSizes={ptreeSizes}
                    setHoverHighlights={setHoverHighlights}
                    editorRef={editorRef}
                    tid2Node={tid2Node}
                    codeProcessRef={codeProcessRef}
                    fetchTrees={fetchTrees}
                ></RightOuterLayer>
            </div>
        </div>
    )
}
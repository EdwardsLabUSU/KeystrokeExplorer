import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3";
import { AstNode, AstTemporalGenerator } from '../ast';
import { Node } from "../utils/Node";
import '../css/tree.css'
import mapNodeNames from "../utils/mapNodeNames"
import TreeSizeChart from "./TreeSizeChart";
import CloseIcon from '@mui/icons-material/Close';
import CollapsibleTreeDraw from './CollapsibleTreeDraw.jsx'
import Button from '@mui/material/Button';

export default function Tree({precompiledTrees, prunedTrees, playback, setPlayback, codeStates, fetchSuccess, treeSizes, treeHeights, ptreeSizes, ptreeHeights, setHoverHighlights, editorRef, tid2Node, showPruned, showDerived, showChart, autoPrune, pruneBefore, pruneAfter, autoCombine, fetchTrees, autoFetch, selectionDf}) { 
    const [loading, setLoading] = useState(false)
    // const [showPruned, setShowPruned] = useState(true)
    // const [showDerived, setShowDerived] = useState(true)
    // const [showChart, setShowChart] = useState(false)

    const [ selected, setSelected ] = useState(false)
    const [ selectedNode, setSelectedNode ] = useState<Node>(null);
    const currNode = useRef(null)

    const [ nodeName, setNodeName ] = useState("");
    const [ firstInstance, setFirstInstance ] = useState(null);
    const [ lastInstance, setLastInstance ] = useState(null) 
    const zoom = useRef(null);

    const lastPlayback = useRef(null);
    const uncollapseLList = useRef([]);
    const uncollapseRList = useRef([]);

    
    const handleZoom = (e) => {
        d3.select("g#links")
            .attr("transform", e.transform)
        d3.select("g#nodes")
            .attr("transform", e.transform)
    }

    useEffect(() => {
        clearTree()
        setSelected(false)
        setSelectedNode(null)
        currNode.current = null
        if (!autoFetch) {
            setLoading(false);
            return;
        }
        if (precompiledTrees === undefined){
            setLoading(false);
            return;
        } 
        setLoading(Object.keys(precompiledTrees).length == 0)
        let size = (d3.select("svg#tree").node() as HTMLElement).getBoundingClientRect();
        if (zoom.current == null) {
            zoom.current = d3.zoom()
                .scaleExtent([0.8,4])
                .translateExtent([[-200,-100], [size.width+300, size.height+100]])
                .on("zoom", handleZoom)
        }

    }, [precompiledTrees])

    const fetchTreeHandler = (selectionDf) => {
        setLoading(true)
        fetchTrees(selectionDf)
    }
    

    const findCollapsible = (node, count) => {
        if (node.children === undefined || node.children === null || node.children.length == 0) return;
        // const nodeData = node.data
        let changes = false;
        let newBefore = false;
        let newAfter = false;
    
        let nodeAncestor = node;
        let nodeState = count;
        // console.log(node);
        while (!changes && nodeAncestor && (nodeAncestor.tparent != null || nodeAncestor.dparent != null) && count - nodeState < pruneBefore) {
            let lastId = nodeAncestor.id
            nodeAncestor = nodeAncestor.dparent != null ? tid2Node[nodeAncestor.dparent] : tid2Node[nodeAncestor.tparent]
            if (nodeAncestor === undefined){// || nodeAncestor && nodeAncestor.id == lastId) {
                break
            }
            // console.log(nodeAncestor)
            if (nodeAncestor && nodeAncestor.length != node.length) {
                changes = true
            }
            nodeState = nodeAncestor.state
        }
        
        // if (!changes && nodeAncestor && nodeAncestor.tparent == null && nodeAncestor.dparent == null) {
        //     changes = true  
        // }
        if (!changes && nodeAncestor && (nodeAncestor.tparent != null || nodeAncestor.dparent != null) && count - nodeState >= pruneBefore) {
            const newNodeAncestor = nodeAncestor.dparent != null ? tid2Node[nodeAncestor.dparent] : tid2Node[nodeAncestor.tparent]
            if (newNodeAncestor && newNodeAncestor.length != node.length) {
                newBefore = true
            } 
        } else if (!changes && nodeAncestor && nodeAncestor.tparent == null && nodeAncestor.dparent == null) {
            if ( count - nodeState >= pruneBefore) {
                newBefore = true
            }
            else {
                changes = true
            }
        }
    
        let nodeChild = node;
        nodeState = count;
        while (!changes && nodeChild && (nodeChild.tchild != null || nodeChild.dchild != null) && nodeState - count < pruneAfter) {
            let lastId = nodeChild.id
            nodeChild = nodeChild.dchild != null ? tid2Node[nodeChild.dchild] : tid2Node[nodeChild.tchild]
            if (nodeChild === undefined || nodeChild && nodeChild.id == lastId) {
                break
            }
            // console.log(nodeChild)
            if (nodeChild && nodeChild.length != node.length) {
                changes = true
            }
            nodeState = nodeChild.state
        } 
        if (!changes && nodeChild && (nodeChild.tchild != null || nodeChild.dchild != null) && nodeState - count >= pruneAfter) {
            nodeChild = nodeChild.dchild != null ? tid2Node[nodeChild.dchild] : tid2Node[nodeChild.tchild]
            // console.log(nodeChild && nodeChild.length != nodeData.length)
            if (nodeChild && nodeChild.length != node.length) {
                newAfter = true
            } 
        } 
        
        let newLCollapse = newBefore && !changes 
        let newRCollapse = newAfter && !changes
        if (newLCollapse && node.children != null) {
            node.newLCollapse = true
            for (const child of node.children) {
                // findCollapsible(child, count)
                const parentId = node.dparent != null ? node.dparent : node.tparent
                uncollapseLList.current = [...uncollapseLList.current, parentId]
            }
            // console.log("new collapse", count, node)

        }
        else if (newRCollapse && node.children != null) {
            node.newRCollapse = true
            for (const child of node.children) {
                // const childId = node.dchild != null ? node.dchild : node.tchild
                // uncollapseRList.current = [...uncollapseLList.current, childId]
                const parentId = node.dparent != null ? node.dparent : node.tparent
                uncollapseRList.current = [...uncollapseRList.current, parentId]
            }
        }
        // TODO for some files it collapses every tree at the root
        else if (!changes && !newLCollapse && node.children != null && node.name != "RootContext") {
            // console.log("collapse", count, node)
            node.collapse = true
        } 
        // else {
        for (const child of node.children) {
            findCollapsible(child, count)
        } 
        // }
      }

    const findCombineSiblings = (node, state) => {
        let combineList = []
        let count = 0
        for (const child of node.children) {
            if (child.collapse && !child.newLCollapse && !child.newRCollapse) {
                combineList.push(child)
            }
            else {
                if (combineList.length > 1) {
                    let combinedNode: Node = {
                        id:0,
                        startIndex:combineList[0].startIndex,
                        length: combineList[combineList.length-1].startIndex + combineList[combineList.length-1].length - combineList[0].startIndex,
                        name: "...",
                        derived: false,
                        children: combineList,
                        collapse: true,
                        combSiblings: true,
                    }
                    const insertAt = count - (combineList.length)
                    node.children.splice(insertAt, combineList.length, combinedNode)
                    if (state == 1490) {
                        console.log(node.children)
                    }
                }
                combineList = []
                
            }
            
            count++
        }
        if (combineList.length > 1) {
            let combinedNode: Node = {
                id:0,
                startIndex:combineList[0].startIndex,
                length: combineList[combineList.length-1].startIndex + combineList[combineList.length-1].length - combineList[0].startIndex,
                name: "...",
                derived: false,
                children: combineList,
                collapse: true,
                combSiblings: true,
            }
            const insertAt = count - (combineList.length)
            node.children.splice(insertAt, combineList.length, combinedNode)  
        }

        for (const child of node.children) {
            if (!child.combSiblings) {
                findCombineSiblings(child, state)
            }
        }
    }

    useEffect(() => {
        if (!prunedTrees) return;
        // const startTime = Date.now()
        let count = 0
        for (const tree of prunedTrees) {
            if (autoPrune) {
                findCollapsible(tree, count)
                if (autoCombine) {
                    findCombineSiblings(tree,count)
                }
            }
            count++
        }
        // console.log(Date.now() - startTime)
    }, [prunedTrees])

    useEffect(() => {
        if (precompiledTrees == null || precompiledTrees == undefined || precompiledTrees.length == 0) return;

        if (selected) {
            let node = currNode.current
            let selectedState = currNode.current.state
            while (selectedState != playback) {
                if (selectedState < playback) {
                    if (currNode.current.dchild == null && currNode.current.tchild == null) {break;}
                    let child = node.dchild != null ? node.dchild : node.tchild;
                    if (child == node.id) {break;}
                    node = tid2Node[child]
                    selectedState = node.state
                } 
                else {
                    if (currNode.current.dparent == null && currNode.current.tparent == null) {break;}
                    let parent = node.dparent != null ? node.dparent : node.tparent;
                    if (parent == node.id) {break;}
                    node = tid2Node[parent];
                    if (!node) {break;}
                    selectedState = node.state;
                }
            }
            if (node != currNode.current && selectedState == playback) {
                currNode.current = node
            }
        }

        buildTree()
        // console.log(treeSizes)
    }, [precompiledTrees, playback, showPruned, showDerived])

    const clearTree = () => {
        d3.select("g#tree").selectAll("*").remove();
        d3.select("g#links").selectAll("*").remove();
        d3.select("g#nodes").selectAll("*").remove();
    }

    const selectNewNode = (node: Node) => {
        console.log(node)
        const code = codeStates[playback];

        setSelected(true);
        setSelectedNode(tid2Node[node.id]);

        currNode.current = tid2Node[node.id]
        console.log(tid2Node[node.id]);

        if (node.name === "Terminal") {
            setNodeName(code.slice(node.startIndex, node.startIndex + node.length))
        } else {
            setNodeName(mapNodeNames(node.name));
        }

        // find the first tid
        let currParent = tid2Node[node.id]
        let lastNode = currParent
        while (currParent.tparent !== undefined || currParent.dparent !== undefined) {
            if (currParent.tparent !== undefined && tid2Node[currParent.tparent] !== undefined) {
                currParent = tid2Node[currParent.tparent]
                // console.log("tparent")
                // console.log(tid2Node[currParent.tparent])
            } else if (currParent.dparent !== undefined && tid2Node[currParent.dparent] !== undefined) {
                // console.log("dparent")
                // console.log(tid2Node[currParent.tparent])
                currParent = tid2Node[currParent.dparent]
            }
            if (currParent.id == lastNode.id) break
            lastNode = currParent
        }
        setFirstInstance(currParent)

        // find the last tid
        let currChild = tid2Node[node.id]
        lastNode = currChild
        while (currChild.tchild !== undefined || currChild.dchild !== undefined) {
            if (currChild.tchild !== undefined && tid2Node[currChild.tchild] !== undefined) {
                currChild = tid2Node[currChild.tchild]
            } else if (currChild.dchild !== undefined && tid2Node[currChild.dchild] !== undefined) {
                currChild = tid2Node[currChild.dchild]
            }
            if (currChild.id == lastNode.id) break
            lastNode = currChild
        }
        setLastInstance(currChild)

    }

    const buildTree = () => {
        let parseTree
        if (showPruned) {
            parseTree = prunedTrees[playback]
            // console.log(parseTree)
        } else {
            parseTree = precompiledTrees[playback];
        }
        const code = codeStates[playback];
        // console.log(code)
        // console.log(parseTree)

        clearTree()
        
        if (parseTree === null || parseTree === undefined ||
            (parseTree["name"]=="EMPTY" && parseTree["children"].length == 0) || 
            parseTree["name"]=="UNCOMPILABLE" ||
            (!showDerived && Object.hasOwn(parseTree, "derived"))) {
                lastPlayback.current = playback;
                return;
            }
            
        CollapsibleTreeDraw(parseTree, code, playback, lastPlayback.current, setHoverHighlights, editorRef, selectNewNode, () => {return currNode.current}, uncollapseLList, uncollapseRList)
        
        zoom.current.scaleTo(d3.select("svg#tree"), 1)
        zoom.current.translateTo(d3.select("svg#tree"), -50, 0, [0,0])
        d3.select("svg#tree").call(zoom.current);
        
        lastPlayback.current = playback
    }

    
    

    const unselectNode = () => {
        setSelected(false)
        setSelectedNode(null)
        currNode.current = null
        // buildTree()
    }

    const gotoFirstTid = () => {
        if (selected) setPlayback(firstInstance.state);
        currNode.current = firstInstance
    }

    const gotoPreviousTid = () => {
        let prevTid = null 
        if (currNode.current.dparent !== undefined && tid2Node[currNode.current.dparent] !== undefined) {
            prevTid = tid2Node[currNode.current.dparent]
        } else if (currNode.current.tparent !== undefined && tid2Node[currNode.current.tparent] !== undefined) {
            prevTid = tid2Node[currNode.current.tparent]
        }
        if (selected && prevTid !== null) {
            setPlayback(prevTid.state);
            currNode.current = prevTid;
        } 
    }

    const gotoInitialTid = () => {
        if (selected) setPlayback(selectedNode.state);
        currNode.current = selectedNode 
    }

    const gotoNextTid = () => {
        let nextTid = null 
        if (currNode.current.dchild !== undefined && tid2Node[currNode.current.dchild] !== undefined) {
            nextTid = tid2Node[currNode.current.dchild]
        } else if (currNode.current.tchild !== undefined && tid2Node[currNode.current.tchild] !== undefined) {
            nextTid = tid2Node[currNode.current.tchild]
        }
        if (selected && nextTid !== null) {
            setPlayback(nextTid.state);
            currNode.current = nextTid;
        } 
    }

    const gotoLastTid = () => {
        if (selected) setPlayback(lastInstance.state);
        currNode.current = lastInstance
    }

    return (
    
        <div className="h-full w-full relative">
            <div className="flex flex-col h-full w-full">
                <div className="h-full w-full">
                    {/* {
                        !loading && precompiledTrees.length == 0 && 
                        <div>
                            <Button variant="text" onClick={() => {fetchTreeHandler(selectionDf)}}>Load Trees</Button>

                        </div>
                    } */}
                    { !fetchSuccess && 
                        <div>
                            <p>Server failed to build trees</p>
                        </div>
                    }
                    { loading &&
                        <div>
                            <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-32 left-1/2">
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
                            <div role="status" className="absolute -translate-x-1/2 -translate-y-2/3 left-1/2 top-8"> 
                                <h2 className="text-4xl font-med"> Loading... </h2>
                            </div>
                        </div>
                    }
                    
                    <div className="w-full h-full">
                        {selected &&
                        <div className="border-solid border-2 border-gray-400 rounded-sm p-2 absolute min-w-[10rem]">
                            <div className="flex flex-row">
                                <div className="ml-5 flex-initial w-full font-semibold text-lg"> { nodeName.length > 15 ? nodeName.substring(0,15)+ "..." : nodeName} </div>
                                <CloseIcon fontSize="small" color="error" className="justify-self-end m-1 cursor-pointer" onClick={unselectNode}></CloseIcon>
                            </div>
                            <div className="w-full"> (start,end): ({selectedNode.startIndex},{selectedNode.startIndex + selectedNode.length - 1}) </div>
                            <div className="w-full"> tid: {selectedNode.id} </div>
                            <div className="w-full"> first state: {firstInstance.state} </div>
                            <div className="w-full"> last state: {lastInstance.state} </div> 
                            <div className="w-full flex justify-between">
                                <span onClick={gotoFirstTid} className="font-medium text-blue-600 hover:underline cursor-pointer"> ⭰ </span>
                                <span onClick={gotoPreviousTid} className="font-medium text-blue-600 hover:underline cursor-pointer"> ⭠ </span>
                                <span onClick={gotoInitialTid} className="font-medium text-blue-600 hover:underline cursor-pointer"> ● </span>
                                <span onClick={gotoNextTid} className="font-medium text-blue-600 hover:underline cursor-pointer"> ⭢ </span> 
                                <span onClick={gotoLastTid} className="font-medium text-blue-600 hover:underline cursor-pointer"> ⭲ </span> 
                            </div>
                        </div> }
                        <svg id="tree" className="w-full h-full">
                        <g id="tree" className="w-full h-full "></g>
                        <g id="links" className="w-full h-full "></g>
                        <g id="nodes" className="w-full h-full "></g>
                        </svg>
                    </div>
                    
                </div>
                {showChart && <div className="h-min">
                    <TreeSizeChart
                        treeSizes={treeSizes}
                        treeHeights={treeHeights}
                        precompiledTrees={precompiledTrees}
                        playback={playback}
                    />           
                </div>}
            </div>
        </div>
    )
}
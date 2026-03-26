import { useState } from "react"
import Tree from "./Tree";
import Table from "./Table";
import CodeProcess from "./CodeProcess";
import TreeSizeChart from "./TreeSizeChart";
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


export default function RightOuterLayer({precompiledTrees, prunedTrees, selectionDf, playback, setPlayback, codeStates, fetchSuccess, treeSizes, treeHeights, ptreeSizes, ptreeHeights, setHoverHighlights, editorRef, tid2Node, codeProcessRef, fetchTrees}) {
    const [dashboardTitle, setDashboardTitle] = useState("table")

    
    // Settings state
    const [fetchTreesAt, setFetchTreesAt] = useState("tab")
    const [showPruned, setShowPruned] = useState(true)
    const [showDerived, setShowDerived] = useState(true)
    const [showChart, setShowChart] = useState(false)
    const [autoPrune, setAutoPrune] = useState(true); 
    const [pruneBefore, setPruneBefore] = useState(5);
    const [pruneAfter, setPruneAfter] = useState(20);
    const [autoCombine, setAutoCombine] = useState(false);
    const [autoFetch, setAutoFetch] = useState(true);


    const [menuOpen, setMenuOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    const toggleDrawer = (newOpen) => () => {
        setMenuOpen(newOpen);
    };

    const toggleInfo = (newOpen) => () => {
        setInfoOpen(newOpen)
    }

    const prunedHandler = () => {
        setShowPruned(!showPruned)
    }

    const derivedHandler = () => {
        setShowDerived(!showDerived)
    }

    const chartHandler = () => {
        setShowChart(!showChart)

    }
    const autoPruneHandler = () => {
        if (autoPrune) {
            setAutoCombine(false)
        }
        setAutoPrune(!autoPrune)
    }
    const autoCombineHandler = () => {
        if (!autoPrune) {
            setAutoCombine(false)
        } else {
            setAutoCombine(!autoCombine)
        }
    }
    const autoFetchHandler = () => {
        setAutoFetch(!autoFetch)
    }

    const InfoMenu = (
        <Box sx={{ width: 250 }} role="presentation">
            <div className="flex flex-row">
                <ChevronRightIcon className="justify-self-end m-3 cursor-pointer" onClick={toggleInfo(false)} />
                <p className="text-4xl justify-center self-center">Hotkeys</p>
            </div>
            <div className="pl-3">
            <ul>
                <li>
                    <p>f / &#8680; - move forward one event</p>
                    <p>d / &#8678; - move backward one event</p>
                    <p>F - move forward 10 events</p>
                    <p>D - move backward 10 events</p>
                </li>
            </ul>
            </div>
        </Box>
      );

    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation">
            <div className="flex flex-row">
                <ChevronRightIcon className=" m-3 cursor-pointer" onClick={toggleDrawer(false)} />
                <p className="text-4xl justify-center self-center">Settings</p>
            </div>

            <div className="pl-3">
                
            <p className="text-2xl">Trees</p>
            <ul>
                <li>    
                    <div>
                        <input type="checkbox" id="prunedCheckbox" checked={showPruned} onChange={prunedHandler} />
                        <label htmlFor="prunedCheckbox">Show Pruned Trees</label>
                    </div>
                </li>
                <li>
                    <div>
                        <input type="checkbox" id="derivedCheckbox" checked={showDerived} onChange={derivedHandler} />
                        <label htmlFor="derivedCheckbox">Show Bridging Trees</label>
                    </div>
                </li>
                <li>
                    <div>
                        <input type="checkbox" id="chartCheckbox" checked={showChart} onChange={chartHandler} />
                        <label htmlFor="chartCheckbox">Show Chart</label>
                    </div>
                </li>
            </ul>
            <p className="text-2xl">Tree Pruning</p>
            <ul>
                <li>
                    <div>
                        <input type="checkbox" id="autoPruneCheckbox" checked={autoPrune} onChange={autoPruneHandler} />
                        <label htmlFor="autoPruneCheckbox">Auto Prune Subtrees</label>
                    </div>
                </li>
                <li>
                    <div>
                        <input type="number" id="pruneBeforeInput" min="0" max="200" value={pruneBefore} onChange={e => {setPruneBefore(e.target.value)}}></input>
                        <label htmlFor="pruneBeforeInput">check prev states</label>
                    </div>
                </li>
                <li>
                    <div>
                        <input type="number" id="pruneAfterInput" min="0" max="200" value={pruneAfter} onChange={e => {setPruneAfter(e.target.value)}}></input>
                        <label htmlFor="pruneAfterInput">check next states</label>
                    </div>
                </li>
                <li>
                    <div>
                        <input type="checkbox" id="autoCombSiblings" checked={autoCombine} disabled={!autoPrune} onChange={autoCombineHandler} />
                        <label htmlFor="autoCombSiblings">Combine Pruned Siblings</label>
                    </div>
                </li>
            </ul>
            {/* <p className="text-2xl">Fetching Trees</p>
            <ul>
                <li>
                    <div>
                        <input type="checkbox" id="autoFetch" checked={autoFetch} onChange={autoFetchHandler} />
                        <label htmlFor="autoFetch">Auto Fetch Parse Trees</label>
                    </div>
                </li>
            </ul> */}
            </div>
        </Box>
      );

    return (
        <div className="flex flex-col h-full w-full space-y-6">
            <div className="w-full text-sm font-medium text-center text-gray-500 border-b border-gray-200 border-b-2">
                <div className="flex flex-row items-center w-full">

                <ul className="flex flex-wrap items-center w-full -mb-px">
                    <li className="mr-2">
                        <a className={`inline-block p-4 border-b-2 rounded-t-lg ${dashboardTitle === 'table' ?
                            'text-blue-600 border-blue-600 active cursor-pointer' :
                            'border-transparent cursor-pointer hover:text-gray-600 hover:border-gray-300'}`}
                            onClick={e => setDashboardTitle('table')}>
                            Table
                        </a>
                    </li>
                    <li className="mr-2">
                        <a className={`inline-block p-4 border-b-2 rounded-t-lg ${dashboardTitle === 'tree' ?
                            'text-blue-600 border-blue-600 active cursor-pointer' :
                            'border-transparent cursor-pointer hover:text-gray-600 hover:border-gray-300'}`}
                            onClick={e => setDashboardTitle('tree')}>
                            Tree
                        </a>
                    </li>
                    <li className="mr-2">
                        <a className={`inline-block p-4 border-b-2 rounded-t-lg ${dashboardTitle === 'codeProcess' ?
                            'text-blue-600 border-blue-600 active cursor-pointer' :
                            'border-transparent cursor-pointer hover:text-gray-600 hover:border-gray-300'}`}
                            onClick={e => setDashboardTitle('codeProcess')}>
                            Code Process
                        </a>
                    </li>
                    {/* <li className="mr-2">
                        <a className={`inline-block p-4 border-b-2 rounded-t-lg ${dashboardTitle === 'treeSize' ?
                        'text-blue-600 border-blue-600 active cursor-pointer' :
                        'border-transparent cursor-pointer hover:text-gray-600 hover:border-gray-300'}`}
                        onClick={e => setDashboardTitle('treeSize')}>
                        Tree Size
                        </a>
                        </li> */}
                </ul>
                <InfoIcon className="justify-self-end m-3 cursor-pointer" onClick={toggleInfo(true)}></InfoIcon>
                <SettingsIcon className="justify-self-end m-3 cursor-pointer" onClick={toggleDrawer(true)}></SettingsIcon>
                </div>
                
            </div>
            <div className="flex-1 h-full border-2">
                {dashboardTitle == "tree" && <div className="h-full">
                    <Tree className="h-full"
                        precompiledTrees={precompiledTrees}
                        prunedTrees={prunedTrees}
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
                        showPruned={showPruned}
                        showDerived={showDerived}
                        showChart={showChart}
                        autoPrune={autoPrune}
                        pruneBefore={pruneBefore}
                        pruneAfter={pruneAfter}
                        autoCombine={autoCombine}
                        fetchTrees={fetchTrees}
                        autoFetch={autoFetch}
                        selectionDf={selectionDf}
                    ></Tree>
                </div>}
                {dashboardTitle == "table" && <div className="h-full">
                    <Table className="h-full"
                        selectionDf={selectionDf}
                        playback={playback}
                    ></Table>
                </div>}
                {dashboardTitle == "codeProcess" && <div className="h-full">
                    <CodeProcess className="h-full"
                        selectionDf={selectionDf}
                        playback={playback}
                        chart={codeProcessRef}
                    ></CodeProcess>
                </div>}
                {/* {dashboardTitle == "treeSize" && <div className="h-full">
                    <TreeSizeChart 
                        treeSizes={treeSizes}
                        treeHeights={treeHeights}
                        precompiledTrees={precompiledTrees}
                        playback={playback}
                    ></TreeSizeChart>
                </div>} */}
            </div>
            <Drawer open={menuOpen} anchor={"right"} onClose={toggleDrawer(false)}>
                {DrawerList}
            </Drawer>
            <Drawer open={infoOpen} anchor={"right"} onClose={toggleInfo(false)}>
                {InfoMenu}
            </Drawer>

        </div>
    )
}

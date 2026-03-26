import React, { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { useResize, useContainerDimensions } from '../utils/windowDimensions';

export default function TreeSizeChart({treeSizes, treeHeights, precompiledTrees, playback}) {
    // const { width, height } = useResize()    
    // console.log(width)

    const footnoteRef = useRef();
    const fDims = useContainerDimensions(footnoteRef)

    const textRef = useRef();
    const tDims = useContainerDimensions(textRef)

    return (
        <div 
            className='flex flex-row h-full min-h-52 w-full'
            ref={footnoteRef}
        >
            <Plot
                className='w-full'
                data={[
                    {
                        x: [...Array(treeSizes.length).keys()],
                        y: [...Array(treeSizes.length).keys()].map(i => !precompiledTrees[i].derived || (i+1 < precompiledTrees.length && !precompiledTrees[i+1].derived) ? treeSizes[i] : null),
                        type: 'lines',
                        // name: 'Parse Tree',
                        line :{
                            color: "#228B22",
                            width: 2.5
                        }
                    },
                    {
                        x: [...Array(treeSizes.length).keys()],
                        y: [...Array(treeSizes.length).keys()].map(i => precompiledTrees[i].derived || (i+1 < precompiledTrees.length && precompiledTrees[i+1].derived) ? treeSizes[i] : null),
                        type: 'lines',
                        // name: 'Bridging Parse Tree',
                        line :{
                            color: "red",
                            width: 2.5
                        }
                    }
                ]}
                layout={{
                    width: fDims["width"]-tDims["width"], 
                    height: fDims["height"]*.92, 
                    title: 'Parse Tree Size over Time',
                    margin: {
                        l: 40,
                        r: 40,
                        b: 50,
                        t: 60,
                        pad: 4
                    },
                    showlegend: false,
                    // legend: {
                    //     x: 0.05,
                    //     xanchor: 'left',
                    //     yanchor: 'top',
                    //     y: 1.1
                    //   },
                    shapes: [
                        {
                            type: 'line',
                            x0: playback,
                            y0: Math.min(... treeSizes.filter(size => size > 0)),
                            x1: playback,
                            y1: Math.max(... treeSizes),
                            line :{
                                color: '#EDBB99',
                                width: 3
                            }
                        }
                    ],
                }}
                config={{
                    staticPlot: true
                }}
                
    
            />
            <div 
                className="flex flex-col w-fit h-full text-nowrap justify-center"
                ref={textRef}
            >
                <p className="text-2xl font-bold px-4">Tree {playback}:</p>
                <p className="text-xl px-4">Size: {treeSizes[playback]}</p>
                <p className="text-xl pb-4 px-4">Height: {treeHeights[playback]}</p>
{/*                 
                {showPruned && <>
                    <p className="text-2xl font-bold">Pruned Tree {playback}:</p>
                    <p className="text-xl">Size: {ptreeSizes[playback]}</p>
                    <p className="text-xl">Height: {ptreeHeights[playback]}</p>
                </>} */}
                
            </div>

        </div>
    )

}
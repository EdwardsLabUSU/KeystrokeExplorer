import * as d3 from "d3";
import { IDataFrame } from "data-forge";
import React, { useEffect, useRef, useState } from "react";
import { svgAsPngUri } from 'save-svg-as-png';

import "../css/codeProcess.css"


export class Change {
    public s: string;
    public prev: Change | null = null;
    public next: Change | null = null;
    public start: number;
    public end: number = -1;

    constructor(s: string, start: number) {
        this.s = s;
        this.start = start;
    }

    isin(i: number) {
        return this.start <= i && this.end >= i;
    }
}

export class Chart {
    public arr: Change[] = [];
    public head: Change = null;
    public end: number = -1;
    public allData: Change[] = [];
    public playbar: number[] = [];
    public uri: any = null;
    public saved: boolean = false;

    newRow(row: any, i: number) {
        this.end = i;
        let j = +row.SourceLocation;
        j = j < this.arr.length ? j : this.arr.length;
        // console.log(i);
        // delete
        if (row.DeleteText && row.DeleteText.length > 0) {
          for (let k = 0; k < row.DeleteText.length; ++k) {
            this.arr[j+k].end = i;
          }
          this.arr = this.arr.slice(0,j).concat(this.arr.slice(j+row.DeleteText.length));
        }
        // insert
        if (row.InsertText && row.InsertText.length > 0) {
            for (let k = 0; k < row.InsertText.length; ++k) {
                let c = new Change(row.InsertText[k], i);
                // console.log(j, k);
                if (!this.head) {
                    this.arr = [c];
                    this.head = c;
                } else if (this.arr.length == 0) {
                    // All characters in the file were deleted
                    let last = this.head;
                    while (last.next != null) last = last.next;
                    last.next = c;
                    c.prev = last;
                    this.arr.push(c);
                } else if (j+k == this.arr.length) {
                    let last = this.arr[this.arr.length-1];
                    last.next = c;
                    c.prev = last;
                    this.arr.push(c);
                } else {
                    // console.log(j,k,this.arr.length);
                    let prev = this.arr[j+k].prev;
                    let next = this.arr[j+k];
                    if (prev && next) {
                        // In the middle
                        if (prev.next != next) {
                        console.error('prev.next != next');
                        }
                        prev.next = c;
                        c.next = next;
                        c.prev = prev;
                        next.prev = c;
                    } else if (prev) {
                        // At the end
                        prev.next = c;
                        c.prev = prev;
                    } else if (next) {
                        // At the beginning
                        c.next = next;
                        next.prev = c;
                    }
                    this.arr = this.arr.slice(0,j+k).concat([c]).concat(this.arr.slice(j+k));
                }
            }  
        }   
    }

    create(df: IDataFrame, onSaved: Function) {
        for (let i = 0; i < df.count(); ++i) {
            let row = df.at(i);
            this.newRow(row, i);
        }
          
        let allChanges = true;
      
        this.allData = [];
        let n = 0;
        let c = this.head;
        while (c != null) {
            n++;
            if (c.end == -1) {
                c.end = this.end;
                this.allData.push(c);
            } else {
                if (allChanges) {
                    this.allData.push(c);
                }
            }
            c = c.next;
        }
        const chartWidth = document.getElementById('chart').clientWidth;
        const chartHeight = document.getElementById('chart').clientHeight;
        const width = chartWidth/n;
        const f = chartHeight/(this.end == 0?1:this.end);
        let chart = this;
      
        d3.select('#codeprocchartgroup')
            .attr("transform", `translate(0 ${chartHeight}) scale(1 -1)`);
      
        // Bars
        {
            let update = d3.select('#bars').selectAll('rect').data(this.allData);
            let enter = update.enter().append('rect');
            update.merge(enter)
                .attr('x', (d,i) => i*width)//yaxisWidth+xScale(d.year))
                .attr('width', width)//xScale.bandwidth())
                .attr('y', d => (this.end-d.end)*f)
                .attr('height', d=>(d.end-d.start)*f)
                // .on('mouseover', function (d, i) {
                //     d3.select(this).style("stroke", "red");
                //     let idx = chart.atEvent(d, playback);
                //     markText(idx, idx+1);
                // })
                // .on('mouseout', function (d, i) {
                //     d3.select(this).style("stroke", "steelblue");
                // })
            ;
            update.exit().remove();
        }
      
        // Start bars
        {
            let update = d3.select('#barsstart').selectAll('rect').data(this.allData);
            let enter = update.enter().append('rect');
            update.merge(enter)
                .attr('x', (d,i) => i*width)//yaxisWidth+xScale(d.year))
                .attr('width', width)//xScale.bandwidth())
                .attr('y', d => (this.end-d.start)*f)
                .style('stroke', 'red')
                .style('stroke-width', '0.5')
                .attr('height', d=>0.5)
            ;
            update.exit().remove();
        }
      
        // End bars
        {
            let update = d3.select('#barsend').selectAll('rect').data(this.allData);
            let enter = update.enter().append('rect');
            update.merge(enter)
                .attr('x', (d,i) => i*width)
                .attr('width', width)
                .attr('y', d => (this.end-d.end)*f)
                .style('stroke', 'red')
                .style('stroke-width', '0.5')
                .attr('height', 0.5)
            ;
            update.exit().remove();
        }
      
        // Compilable
        if (df.at(0)['X-Compilable']) {
            let update = d3.select('#compilable').selectAll('rect').data(df);
            let enter = update.enter().append('rect');
            update.merge(enter)
                .attr('x', 0)
                .attr('width', 0.5)
                .attr('y', (d,i) => (this.end-i)*f)
                .attr('height', 0.5)
                // .style('stroke', d => d.compilable ? 'lightgreen' : 'red')
                // .style('fill', d => d.compilable ? 'lightgreen' : 'red')
                .style('stroke', d => d['X-Compilable']==1 ? 'lightgreen' : 'red')
                .style('fill', d => d['X-Compilable']==1 ? 'lightgreen' : 'red')
                .style('stroke-width', '3.5')
            ;
            update.exit().remove();
        } else {
            console.log('Compilation information is not available');

            
        }
      
        //------------------------------------------------------------
        // Okay, we've rendered the chart. Now convert it to an image
        // for performance.
        //------------------------------------------------------------
        svgAsPngUri(document.getElementById("chart"), {"excludeUnusedCss": true}).then(uri => {
        // svgAsPngUri(document.getElementById("chart"), "chart.png").then(uri => {
            
            d3.select('#bars').selectAll('*').remove();
            d3.select('#barsstart').selectAll('*').remove();
            d3.select('#barsend').selectAll('*').remove();
            d3.select('#compilable').selectAll('*').remove();
            this.uri = uri;

            const chartWidth = document.getElementById('chart').clientWidth;
            const chartHeight = document.getElementById('chart').clientHeight;
            let enter = d3.select('#codeprocimage')
                .selectAll('image')
                .data([uri])
                .enter()
                .append("svg:image")
                .attr("transform", `translate(0 ${chartHeight}) scale(1 -1)`)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', chartWidth)
                .attr('height', chartHeight)
                .attr("xlink:href", uri)
            ;
            
        });
        onSaved(true);
        this.saved = true;
    }

    updatePlaybar(value: number) {
        const chartWidth = document.getElementById('chart').clientWidth;
        const chartHeight = document.getElementById('chart').clientHeight;
        const f = chartHeight/(this.end == 0?1:this.end);
        this.playbar = [value];
        let update = d3.select('#playbarg').selectAll('rect')
            .data(this.playbar);
        let enter = update.enter();
        enter = enter
            .append('rect');

        // console.log(this.end)
        // console.log(f)

        update.merge(enter)
            .attr('id', 'playbar')
            .attr('x', 0)
            .attr('width', chartWidth)
            .attr('y', d => (this.end-d)*f)
            .attr('height', 1.5)
            .style('stroke', '#EDBB99')
            .style('fill', '#EDBB99')
        ;
        update.exit().remove();
    }

    // rerender() {
    //     const chartWidth = document.getElementById('chart').clientWidth;
    //     const chartHeight = document.getElementById('chart').clientHeight;
    //     let enter = d3.select('#codeprocimage')
    //         .selectAll('image')
    //         .data([this.uri])
    //         .enter()
    //         .append("svg:image")
    //         .attr("transform", `translate(0 ${0}) scale(1 1)`)
    //         .attr('x', 0)
    //         .attr('y', 0)
    //         .attr('width', chartWidth)
    //         .attr('height', chartHeight)
    //         .attr("xlink:href", this.uri)
    //     ;
    // }

    // Get the index of a change at event i
    atEvent(change: Change, i: number) {
        if (!change.isin(i)) return -1;
        let c = this.head;
        let j = 0;
        while (c != null) {
            if (c == change) {
                return j;
            }
            if (c.isin(i)) {
                j++;
            }
            c = c.next;
        }
        throw 'Unexpected';
    }
      
    //   Chart.prototype.getStatistics = function() {
    //     // // Statistics
    //     // let c = this.head;
    //     // let total = 0;
    //     // let deleted = 0;
    //     // while (c != null) {
    //     //   total++;
    //     //   if (c.end > -1) deleted++;
    //     //   c = c.next;
    //     // }
    //     // console.log(`${deleted}/${total}`);
    //   }
      
    //   Chart.prototype.printAll = function() {
    //     let c = this.head;
    //     let temp = '';
    //     while (c != null) {
    //       temp += c.s;
    //       c = c.next;
    //     }
    //     console.log(temp);
    //   }
      
    //   Chart.prototype.printFinal = function() {
    //     let temp = '';
    //     for (let i = 0; i < this.arr.length; ++i) {
    //       temp += this.arr[i].s;
    //     }
    //     console.log(temp);
    //   }
      
}

export default function CodeProcess({selectionDf, playback, chart}: {selectionDf: IDataFrame, playback: number, chart: React.MutableRefObject<any>}) {
    const [ saved, setSaved ] = useState(false)
    const saving = useRef(false)

    useEffect(() => {
        // console.log(selectionDf)
        if (selectionDf == null || saving.current == true) return
        // if (chart.current == null) {
            // saving.current = true
            // setSaved(false)
            chart.current = new Chart();
            d3.select('#codeprocimage').selectAll('*').remove();
            
            if (selectionDf.count() > 0) {
                chart.current.create(selectionDf, setSaved);
                // saving.current = false
            } else {
                d3.select('#bars').selectAll('*').remove();
                d3.select('#barsstart').selectAll('*').remove();
                d3.select('#barsend').selectAll('*').remove();
                // saving.current = false
                return;
            }
            
        // } else if (chart.current.saved) {
            // chart.current.rerender()
            // chart.current.updatePlaybar(playback);
            // setSaved(true)
        // }
        // chart.current.updatePlaybar(playback);
    }, [selectionDf])
      
    useEffect(() => {
        if (chart.current != null && saved) {
            chart.current.updatePlaybar(playback);
        }
    }, [playback, saved])
      
    
    return (
        <div id="Charts">
          <svg className="chart" id="chart">
            <g id="codeprocchartgroup">
              <g id="bars"></g>
              <g id="barsstart"></g>
              <g id="barsend"></g>
              <g id="compilable"></g>
              <g id="codeprocimage"></g>
              <g id="playbarg"></g>
            </g>
          </svg>
        </div>
    )
}
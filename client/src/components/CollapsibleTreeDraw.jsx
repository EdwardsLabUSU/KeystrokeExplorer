import * as d3 from "d3";
import mapNodeNames from "../utils/mapNodeNames"


export default function CollapsibleTreeDraw (data, code, playback, lastPlayback, setHoverHighlights, editorRef, selectNewNode, getCurrNode, uncollapseList, uncollapseRList) {
  
    // ----------------------------------------------------------------------
    // MDM paste Observables notebook code here, in proper (not "literate(sic) programming") order.
    // ----------------------------------------------------------------------
    const size = (d3.select("svg#tree").node()).getBoundingClientRect();
    const width = size.width;
    const height = size.height;
    // const dx = 10;
    // const dy = width / 6;
    const margin = ({top: 10, right: 120, bottom: 10, left: 40});
    const tree = d3.tree().size([(size.height), (size.width) * 0.8]);
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
    // ----------------------------------------------------------------------

    const root = d3.hierarchy(data);
  
    root.x0 = 10;
    root.y0 = 10;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
    });
    
    const svg = d3.select("svg#tree")
  
    const gLink = d3.select("g#links")
  
    const gNode = d3.select("g#nodes")      
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");


    gNode.attr("transform", "translate(75, 0)")
    gLink.attr("transform", "translate(75, 0)")

    const getSymbolOfSize = (size) => {
      return d3.symbol().size(size).type(d => {
          if (Object.hasOwn(d.data, "combSiblings")) return d3.symbolDiamond;
          if (Object.hasOwn(d.data, "transient")) return d3.symbolCircle;
          else if (Object.hasOwn(d.data, "changed") || Object.hasOwn(d.data, "newChanged")) {
              return d3.symbolSquare;
          } 
          else if (Object.hasOwn(d.data, "childrenChanged") || Object.hasOwn(d.data, "newChildrenChanged")) {
              return d3.symbolTriangle;
          }
          return d3.symbolCircle;
      })
    }

    function getFill (d) {
        // if (Object.hasOwn(d.data, "transient") && Object.hasOwn(d.data, "newChanged")) {
        //     return "#40E0D0";
        // }
        if (getCurrNode() != null && d.data.id == getCurrNode().id) return "purple"
        if (Object.hasOwn(d.data, "combSiblings")) return "#000000"
        if (Object.hasOwn(d.data, "newChanged")) {
            return "#FF0000";
        } 
        else if (Object.hasOwn(d.data, "newChildrenChanged")) {
            return "#FFBF00";
        }
        else if (Object.hasOwn(d.data, "newTransient")) {
            return "#40E0D0"
        }
        if (Object.hasOwn(d.data, "transient") || Object.hasOwn(d.data, "changed") || Object.hasOwn(d.data, "childrenChanged")) {
            return "#FFFFFF";
        }
        return "#364e74";
    }

    function searchForNode(node, searchId) {
      if (node.data.id == searchId) {
        return true;
      }
      if (node.children == null) return false;
      for (const child of node.children) {
        if (searchForNode(child, searchId) == true) {
          return true;
        }
      }
      return false;
    }

    function collapse(node) {
        if (node.children === undefined || node.children === null || node.children.length == 0) return;
        node.children.forEach(collapse)

        if ((node.data.collapse && !(node.data.newLCollapse && lastPlayback < playback)) || 
            (node.data.newRCollapse && lastPlayback < playback) ||
            (node.data.newLCollapse && lastPlayback > playback) ||
            (uncollapseList.current.includes(node.data.id) && lastPlayback > playback)
        ) {
          if (getCurrNode() != null && searchForNode(node, getCurrNode().id)) {
            return;
          } 
          node.children = null
        }
        if ((uncollapseRList.current.includes(node.data.id) && lastPlayback > playback)) {
            node.children = node._children
        }
    }

    function newLCollapse(node) {
        // if ( ) return;//|| node.children === null || node.children.length == 0
        if ((node.data.newLCollapse && lastPlayback < playback) ||
            (uncollapseRList.current.includes(node.data.id) && lastPlayback > playback)
        ) {
          if (getCurrNode() != null && searchForNode(node, getCurrNode().id)) {
            return;
          } 
          node.children = null
          update(node, false);
        }
        else  {
            if ((uncollapseList.current.includes(node.data.id) && lastPlayback > playback) ||
                (node.data.newRCollapse && lastPlayback < playback)
            ) {
                node.children = node._children
                update(node, false);
            }
            if (node.children != undefined && node.children != null && node.children.length != 0) {
                node.children.forEach(newLCollapse)
            }
        }
    }
  
    function update(source, newRender) {
      const duration = 250;
      const nodes = root.descendants().reverse();
      const links = root.links();
  
      // Compute the new tree layout.
      tree(root);
  
      const transition = svg.transition()
          .duration(duration)
  
      // Update the nodes…
      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

      // Enter any new nodes at the parent's previous position.
      let nodeEnter;
      if (newRender) {
        nodeEnter = node.enter().append("g")
          .attr("transform", d => `translate(${d.y},${d.x})`)
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1)
      } else {
        nodeEnter = node.enter().append("g")
          .attr("transform", d => `translate(${source.y0},${source.x0})`)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0)
      }
  
      // Style nodes
      nodeEnter.append("path")
          // .attr("radius", 30)
          .style('stroke-width', 3)
          .attr("fill", d => getFill(d))
          .attr("d", getSymbolOfSize(50))
          .attr("id", (d) => {return `tid-${d.data.id}`})
          .attr("stroke", (d) => {
                  if (getCurrNode() != null && d.data.id == getCurrNode().id){
                      return "purple"  
                  } 
                  else if (Object.hasOwn(d.data, "combSiblings")) return "#000000"
                  else if (Object.hasOwn(d.data, "transient") || Object.hasOwn(d.data, "newTransient")) return "#40E0D0";
                  else if (Object.hasOwn(d.data, "changed") || Object.hasOwn(d.data, "newChanged")) {
                      return "#FF0000";
                  } 
                  else if (Object.hasOwn(d.data, "childrenChanged") || Object.hasOwn(d.data, "newChildrenChanged")) {
                      return "#FFBF00";
                  }
                  return "#364e74";
          })
          .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(2).attr("d", getSymbolOfSize(200)).attr("fill", "purple");
            // console.log(this)
            
            // add highlights for corresponding chunk of code
            const { lineNumber, column } = editorRef.current.getModel().getPositionAt(d.data.startIndex);
            const endLocation = editorRef.current.getModel().getPositionAt(d.data.startIndex + d.data.length);
            
            setHoverHighlights([{
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: endLocation["lineNumber"],
                endColumn: endLocation["column"]
            }])
            
            // add temporary styling to parents of hovered node
            let parent = d.parent;
            // console.log(parent)
            while (parent) {
                d3.select(`#tid-${parent.data.id}`)
                .attr("d", getSymbolOfSize(130))
                    .attr("fill", "purple")
                    // .attr("stroke", "purple")
                    .classed("highlighted-parent", true)
                    ;
                    parent = parent.parent
                }
            })
        .on("mouseout", function (event, d) {
            // TODO = selected node is locked when event listener added
            // console.log(selectedNode)
            // console.log(currNode.current)
            if (d.data.id == getCurrNode.id) {
              d3.select(this).transition().duration(2).attr("d", getSymbolOfSize(50)).attr("fill", "purple").attr("stroke", "purple");
            }
            d3.select(this).transition().duration(2).attr("d", getSymbolOfSize(50)).attr("fill", d => getFill(d));
            // TODO - this should probably just remove the single highlight for the moused-out node
            setHoverHighlights([])
            
            // remove parent highlights
            d3.selectAll(".highlighted-parent")
            .attr("d", getSymbolOfSize(50))
            .attr("fill", d => getFill(d))
            .classed("highlighted-parent", false)
            ;
        })
        .on("click", (event, d) => {
            console.log("click", d)
            if (event.altKey) {
              d.children = d.children ? null : d._children;
              update(d, false);
            } else{
              if (d.data.combSiblings) return;
              selectNewNode(d.data);
            }            
        })

      nodeEnter.append("text")
          .attr("dy", "0.31em")
          .attr("x", d => d._children ? -6 : 6)
          .attr("text-anchor", d => d._children ? "end" : "start")
          .text(d => {
                    if (d.data.name == "Terminal") {
                        return code.slice(d.data.startIndex, d.data.startIndex + d.data.length);
                    }
                    return mapNodeNames(d.data.name)
                })
          .attr("class", "text")
          .attr("font-weight", (d) => Object.hasOwn(d, "children") && d.children == null && Object.hasOwn(d, "_children") && d._children.length > 0 ? 700 : 400)
          .attr("text-anchor", (d) => d.children === undefined ? "start" : "end")
          .style("font-size", "14px")
          .attr("dx", (d) => d.children === undefined ? 5 : -5)
          .attr("dy", (d) => d.children === undefined ? 5 : -10)
        .clone(true).lower()
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", 3)
          .attr("stroke", "white");

      // Transition nodes to their new position.
      if (newRender) {
        const nodeUpdate = node.merge(nodeEnter).transition()
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
      } else {
        const nodeUpdate = node.merge(nodeEnter).transition()
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)

      }     

      node.selectAll("text").transition()
          .attr("font-weight", (d) => Object.hasOwn(d, "children") && d.children == null && Object.hasOwn(d, "_children") && d._children != undefined && d._children.length > 0 ? 700 : 400)

  
        //         .on("click", (event: MouseEvent, d: any) => {
        //             console.log("click", d)
        //             if (event.altKey) {
        //                 d.data._children = d.data.children
        //                 console.log(d.children)
        //                 d.children = d.children ? null : d.data._children
        //                 console.log(d.children)
        //                 updateTree(d, null, null)
        //                 // clickCollapse(d.data)
        //             } else{
        //                 d3.select(this).transition().duration(2).attr("d", getSymbolOfSize(500)).attr("fill", "black");
        //                 // selectNewNode(d.data);
        //                 // buildTree()
        //                 // treeNodeClick(d);
        //             }
        //         })
  
      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition(transition).remove()
          .attr("transform", d => `translate(${source.y},${source.x})`)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);
  
      // Update the links…
      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);
  
      
  

      // Transition links to their new position.
      if (newRender) {
        const linkEnter = link.enter().append("path")
          .attr("class", "link")
          .attr("d", d => {
            const o = {x: d.x, y: d.y};
            return diagonal({source: o, target: o});
        });
        link.merge(linkEnter).transition(transition)
          .attr("d", diagonal);
      } else {
        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
          .attr("class", "link")
          .attr("d", d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });
        link.merge(linkEnter).transition(transition)
          .attr("d", diagonal);
      }



      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
          .attr("d", d => {
            const o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          });
  
      // Stash the old positions for transition.
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
  
    // findCollapsible(root)
    collapse(root)
    update(root, true);
    newLCollapse(root)
    // findNewCollapsible(root)


  
    return svg.node();
    }
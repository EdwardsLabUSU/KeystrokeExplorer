import { AstBuilder, AstNode, AstGenerator, createEmptyAst } from "./ast";

export class TemporalHierarchy {

    // don't reset this value
    private next_tid: number = 0
    private tid2node: Array<AstNode> = new Array();

    // idxInLastSnapshot[i] contains the index in the last snapshot (last edit)
    // for the character currently at index i. -1 if the character was just
    // inserted.
    private idxInLastSnapshot = Array<number>();
    private allIdxInLastSnapshot = Array<Array<number>>();

    // idxInLastCompilable[i] contains the index in the last compilable snapshot
    // for the character currently at index i. -1 if the character was inserted
    // since the last compilable event.
    private allIdxInLastCompilable = Array<Array<number>>();

    // Whether the last code snapshot was compilable
    // (the AST in the last iteration existed).
    private allCompilable = Array<boolean>();
    private asts: Array<AstNode> = [];

    private set_tids(node: AstNode) {
        if (node === null) return;

        if (node.tid === undefined) {
            node.tid = this.next_tid;
            this.next_tid += 1;
        }
        node.children?.forEach((child: AstNode) => {
            this.set_tids(child);
        });
    }

    public pushCompilableTree(compilable: boolean) {
        this.allCompilable.push(compilable);
    }

    public getTid() {
        return this.tid2node;
    }

    public reset() {
        this.idxInLastSnapshot = Array<number>();
        this.allIdxInLastSnapshot = Array<Array<number>>();

        // this.idxInLastCompilable = Array<number>();
        this.allIdxInLastCompilable = Array<Array<number>>();

        this.allCompilable = Array<boolean>();
        this.asts = [];
    }

    public temporalCorrespondence(i: number, eventNumber: number, insertText: string, deleteText: string) {
        // Setup
        const inserted = Array<number>(insertText.length);
        inserted.fill(-1);

        // Update idxInLastSnapshot for this iteration.
        this.idxInLastSnapshot = this.idxInLastSnapshot.map((_, i) => i);

        // beforeInsert/afterInsert are the mappings of all characters preceding/following the insertion and deletion.
        const beforeInsert = this.idxInLastSnapshot.slice(0, i);
        const afterInsert = this.idxInLastSnapshot.slice(i + deleteText.length);

        // Create the new array.
        this.idxInLastSnapshot = beforeInsert.concat(inserted).concat(afterInsert);
        this.allIdxInLastSnapshot.push(this.idxInLastSnapshot);
        this.allIdxInLastCompilable.push(this.idxInLastSnapshot.slice());

        // exit if this is the first event, or the last tree was compilable
        if (eventNumber === 0 || this.allCompilable.at(-2)) return;

        for (let k = 0; k < this.allIdxInLastCompilable.at(-1).length; ++k) {
            // If the character was not inserted, get the index from the
            // idxInLastCompilable from the last snapshot.
            const pk = this.idxInLastSnapshot[k];

            if (pk !== -1) {
                this.allIdxInLastCompilable.at(-1)[k] = this.allIdxInLastCompilable.at(-2)[pk];
            }
        }
    }

    public temporalHierarchy(ast: AstNode) {
        // Update tid values. asts is the list of all asts to
        // this point.
        this.set_tids(ast);
        if (this.asts.length > 0) {
            set_all_tparents(this.asts, ast, this.allIdxInLastCompilable, this.allCompilable);
        }
        this.asts.push(ast);

        // the root (module) gets the wrong TID so fix it here
        let moduleIndex = this.tid2node.length - 1;
        while (moduleIndex > 0 && this.tid2node[moduleIndex].type !== "Module") {
            moduleIndex -= 1;
        }
        if (moduleIndex !== -1) {
            ast.tparent = moduleIndex;
            this.tid2node[ast.tparent].tchildren = ast.tid;
        }

        // Set number of edits since last compilable state for each ast node
        // Note: this currently gets the number of edits since the last snapshot only.
        this.setNumEdits(ast);

        // Update tid2node
        const gen = AstGenerator(ast);
        let cur = gen.next();
        while (!cur.done) {
            let node: AstNode = cur.value.node;
            this.tid2node[node.tid] = node;
            cur = gen.next();
        }
    }

    public setNumEdits(node: AstNode) {
        if (node.start === undefined) {
            throw new Error("node.start is undefined");
        }

        // initial program state
        if (this.allCompilable.length === 1 && this.allCompilable[0] === true) {
            node.numInserts = 0;
        }

        // new node
        else if (node.tparent === undefined) {
            node.numInserts += (node.end - node.start) + 1;
        }

        // lastest state is compilable
        else if (this.allCompilable[this.allCompilable.length - 2]) {
            const oldLength = this.tid2node[node.tparent].end - this.tid2node[node.tparent].start;
            const newLength = node.end - node.start;

            node.numInserts += Math.max(0, newLength - oldLength);
            node.numDeletes += Math.max(0, oldLength - newLength);
        }

        // last state is uncompilable
        else {
            let finalState = this.allCompilable.length - 1;
            let firstState = this.allCompilable.length - 2;
            while (!this.allCompilable[firstState]) firstState--;

            // forward pass (start -> end) for deletions
            let start = this.tid2node[node.tparent].start;
            let end = this.tid2node[node.tparent].end;
            let oldSize = (end - start) + 1;

            for (let index = firstState + 1; index <= finalState; ++index) {
                const idxInLastSnapshot = this.allIdxInLastSnapshot.at(index);

                // shrink the start & end so they fit in the selection
                let startIndex = idxInLastSnapshot.findIndex((element) => element === start);
                let endIndex = idxInLastSnapshot.findIndex((element) => element === end);
                while (startIndex === -1 && start < end) {
                    start += 1;
                    startIndex = idxInLastSnapshot.findIndex((element) => element === start);
                }
                while (endIndex === -1 && start < end) {
                    end -= 1;
                    endIndex = idxInLastSnapshot.findIndex((element) => element === end);
                }

                // expand the edges so we gobble up any -1s on the edges
                //   [0, 1, 2] -> [0, 1, 2, -1, -1]
                while (idxInLastSnapshot.at(startIndex - 1) === -1 && (startIndex - 1) >= 0) {
                    startIndex -= 1;
                }
                while (idxInLastSnapshot.at(endIndex + 1) === -1 && (endIndex + 1) < idxInLastSnapshot.length) {
                    endIndex += 1;
                }

                let selection = idxInLastSnapshot.slice(startIndex, endIndex + 1);
                const newSize = selection.length;
                node.numInserts += Math.max(0, newSize - oldSize);
                node.numDeletes += Math.max(0, oldSize - newSize);
                oldSize = newSize;
                start = startIndex;
                end = endIndex;
            }
        }

        node.children?.forEach((n: AstNode) => {
            this.setNumEdits(n);
        });
    }
}

function prev_start_end_impl(start: number, end: number, idxInLastSnapshot: Array<number>): Array<number> {

    if (end < start) {
        throw new Error("End indicie comes before the start");
    }

    let i: number = start;
    let j: number = end;

    // Iterate past newly-added characters to the beginning then the end of the node
    while (idxInLastSnapshot[i] === -1 && i < j) {
        i += 1;
    }
    while (idxInLastSnapshot[j] === -1 && i < j) {
        j -= 1;
    }

    let prev_start: number = idxInLastSnapshot[i];
    let prev_end_minus_one: number = idxInLastSnapshot[j];

    if (prev_start === prev_end_minus_one) {
        if (prev_start === -1) {
            return [-1, -1];
        }
        return [prev_start, prev_end_minus_one + 1];
    } else {
        return [prev_start, prev_end_minus_one + 1];
    }
}

// This function takes an ast node, its start and end indices,
// and finds the corresponding start and end indices in
// the last compilable code.
function prev_start_end(node: AstNode, idxInLastSnapshot: Array<number>): Array<number> {
    if (node.start === undefined) {
        throw new Error("node.start undefined in prev_start_end");
    }

    // this occurs when the file is deleted -- prevent errors
    if (node.end < node.start) node.end = 0;

    return prev_start_end_impl(node.start, node.end, idxInLastSnapshot);
}

// Uses index correspondences to set tparents
function set_all_tparents(
    asts: Array<AstNode>,
    cur: AstNode,
    allIdxInLastCompilable: Array<Array<number>>,
    allCompilable: Array<boolean>
) {
    if (cur.start === undefined) {
        throw new Error("cur.start undefined in set_all_parents");
    }

    // curStartInPrevCoords and curEndInPrevCoords are the start and end indices in the code
    // as it was when the prev ast was created.
    let curStartInPrevCoords: number, curEndInPrevCoords: number;
    try {
        [curStartInPrevCoords, curEndInPrevCoords] = prev_start_end(cur, allIdxInLastCompilable.at(-1));
    } catch (error) {
        console.log(cur)
        throw error;
    }

    // traverses through prev looking for a tparent for cur
    set_cur_tparent(asts.at(-1), cur, curStartInPrevCoords, curEndInPrevCoords);

    // If no tparent was set but it has previous coordinates then it is likely commented out
    // in the previous tree. Iterate back until we either end up with -1 coordinates or find
    // a tparent.
    let k = -1;
    let l = -1;
    while (cur.tparent === undefined && curStartInPrevCoords > -1) {
        if (curEndInPrevCoords == -1) {
            throw new Error("Unexpected -1 prev coords");
        }
        k -= 1;
        l -= 1;
        while (l >= -allCompilable.length && !allCompilable.at(l)) l -= 1;

        try {
            [curStartInPrevCoords, curEndInPrevCoords] = prev_start_end_impl(curStartInPrevCoords, curEndInPrevCoords, allIdxInLastCompilable.at(l));
        } catch (error) {
            console.log(cur)
            throw error;
        }
        set_cur_tparent(asts.at(k), cur, curStartInPrevCoords, curEndInPrevCoords);
    }

    // Make recursive call for all of cur's children
    cur.children?.forEach((n: AstNode) => {
        set_all_tparents(asts, n, allIdxInLastCompilable, allCompilable);
    });
}

// traverse through prev looking for a tparent for cur
function set_cur_tparent(prev: AstNode, cur: AstNode, curStartInPrevCoords: number, curEndInPrevCoords: number) {

    // the first state is uncompilable
    // if (prev === undefined) throw new Error("Uncompilable first state");
    if (prev === undefined) prev = createEmptyAst();
    if (prev.start === undefined) {
        throw new Error("prev.start undefined");
    }

    const contains: boolean = (
        prev.start <= curStartInPrevCoords &&
        prev.end >= curStartInPrevCoords
    );
    if (!contains) return;

    if (prev.tchildren === undefined) {

        // if we are the same type, take priority over names
        if (prev.type === cur.type && prev.type !== "BinOp") {
            cur.tparent = prev.tid;
            prev.tchildren = cur.tid;
            cur.intermediateLength = prev.intermediateLength;
        }

        // special case with binary operations
        if (prev.type === cur.type && prev.type === "BinOp" && cur.tparent === undefined) {
            cur.tparent = prev.tid;
            prev.tchildren = cur.tid;
            cur.intermediateLength = prev.intermediateLength;
        }

        // special case for assignment -> aug assign
        if ((prev.type === "AugAssign" || prev.type === "Assign") && (cur.type === "AugAssign" || cur.type === "Assign")) {
            cur.tparent = prev.tid;
            prev.tchildren = cur.tid;
            cur.intermediateLength = prev.intermediateLength;
        }

        // if the node already has a better-fit parent, skip this check
        //  * this is only valid if the node starts at the EXACT same spot
        if (
            cur.tparent === undefined &&
            (prev.type === "Name" || cur.type === "Name") &&
            prev.start === curStartInPrevCoords
        ) {
            cur.tparent = prev.tid;
            prev.tchildren = cur.tid;
            cur.intermediateLength = prev.intermediateLength;
        }

    }

    // go deeper to see if there is a better fit
    prev.children?.forEach((n: AstNode) => {
        set_cur_tparent(n, cur, curStartInPrevCoords, curEndInPrevCoords);
    });
}
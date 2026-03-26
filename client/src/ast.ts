import { ErrorListener, CharStream, CommonTokenStream } from "antlr4";
import Python3Lexer from "./parser/Python3Lexer";
import Python3Parser from "./parser/Python3Parser";
import { Python3ParserVisitor } from "./parser/Python3ParserVisitor";

export class AstNode {
    // base attributes
    public descendants: number;
    public type: string;
    public name: string;
    public children: Array<AstNode>;
    public parent: AstNode;
    public ctx;

    // The event
    public timestamp: number;
    public treeNumber: number;

    // text-position attributes -- compute later.
    public startLine: number;
    public startCol: number;
    public endLine: number;
    public endCol: number;
    public start: number;
    public end: number; // one past the last character of the node

    // Temporal relationships. These attributes describe a node's
    // ancestry and posterity in time. Using them we can answer questions
    // such as "when was this node created?" and "how many keystrokes
    // were spent on this node?"

    // tid - a unique "temporal ID"
    public tid: number | undefined = undefined;
    // tparent - temporal parent - the node from which this node was created
    public tparent: number | undefined = undefined;
    // tchildren - temporal children - nodes created out of this node
    public tchildren: number | undefined = undefined;

    // The number of new characters since the last compilable state
    public numNewChars: number = 0;
    public intermediateLength: number = 0;
    public bodyInserts: number = 0;
    public bodyDeletes: number = 0;
    public numInserts: number = 0;
    public numDeletes: number = 0;
    public numLocalInserts: number = 0;
    public numLocalDeletes: number = 0;

    constructor(ctx: any, type: string, name: string) {
        this.type = type;
        this.name = name;
        this.children = []
        this.ctx = ctx;

        this.startCol = ctx.start.column;
        this.startLine = ctx.start.line;
        this.endCol = ctx.stop.column;
        this.endLine = ctx.stop.line;
        this.start = ctx.start.start;
        this.end = ctx.stop.stop;
    }
}

//-------------------------------------------------
// AstGenerator
//-------------------------------------------------

export type AstGeneratorValue = {
    node: AstNode;
    level: number;
}

export function* AstGenerator(node: AstNode, level: number = 0): Generator<AstGeneratorValue, null, any> {
    if (node) {
        yield { node: node, level: level };
        for (let i: number = 0; i < node.children?.length; ++i) {
            let n: AstNode = node.children[i];
            yield* AstGenerator(n, level + 1);
        }
    }
    return null;
}

export function* AstTemporalGenerator(node: AstNode, tid2node: Array<AstNode>, level: number = 0): Generator<AstGeneratorValue, null, any> {
    if (node) {
        yield { node: node, level: level };
        yield* AstTemporalGenerator(tid2node[node.tchildren], tid2node, level + 1);
    }
    return null;
}

export function createEmptyAst() {
    return AstBuilder.createAst("", -1);
}

export class AntlrErrorWatcher extends ErrorListener<any> {
    syntaxError(recognizer, offendingSymbol, line, column, msg, err) {
        throw new Error(`line ${line}, col ${column}: ${msg}`);
    }

    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
        throw new Error(`start ${startIndex}, stop ${stopIndex}: ${exact}`);
    }

    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
        throw new Error(`start ${startIndex}, stop ${stopIndex}, alts ${conflictingAlts}`);
    }

    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
        throw new Error(`start ${startIndex}, stop ${stopIndex}, pred ${prediction}`);
    }
}

//-------------------------------------------------
// AstBuilder
//-------------------------------------------------
export abstract class AstBuilder {
    static treeNumber = 0;

    static lexer: Python3Lexer = null;
    static parser: Python3Parser = null;
    static visitor: Python3ParserVisitor = null;
    static errorListener = new ErrorListener();

    static setup() {
        this.lexer = new Python3Lexer(new CharStream("\n"));
        this.parser = new Python3Parser(new CommonTokenStream(this.lexer));
        this.visitor = new Python3ParserVisitor();
        this.parser.removeErrorListeners();
        this.parser.addErrorListener(new AntlrErrorWatcher());

        // warm up the parser
        const tree = this.parser.file_input();
        const visitor = new Python3ParserVisitor();
        visitor.visitFile_input(tree);
    }

    static createAst(codeState: string, treeNumber: number) {
        const chars = new CharStream(codeState + "\n");

        this.lexer = new Python3Lexer(chars);
        this.parser.setTokenStream(new CommonTokenStream(this.lexer));

        const tree = this.parser.file_input();

        const result = this.visitor.visitFile_input(tree);

        const gen = AstGenerator(result);

        let cur = gen.next();
        while (!cur.done) {
            let node: AstNode = cur.value.node;
            node.treeNumber = treeNumber;
            cur = gen.next();
        }

        return result;
    }

    static swapParents(newParent: AstNode, oldParent: AstNode) {
        newParent.children = oldParent.children;

        oldParent.children.forEach(child => {
            child.parent = newParent;
        });

        oldParent = null;
    }

    static condenseAst(node: AstNode) {
        // base-case
        if (node.children.length === 0) return;

        // skip parents with multiple children
        if (node.children.length === 1) {
            const child = node.children[0];

            // if this passes, they occupy the same space
            if (
                (child.startCol === node.startCol) &&
                (child.startLine === node.startLine) &&
                (child.endCol === node.endCol) &&
                (child.endLine === node.endLine)
            ) {
                AstBuilder.swapParents(node, child);
            }
        }

        node.children.forEach(child => {
            AstBuilder.condenseAst(child);
        });
    }

    static getIndex(line: number, col: number, lineLengthCumSum: Array<any>) {
        return lineLengthCumSum[line] + col;
    }

    static updateRegions(node: AstNode, code: string) {
        // Get the number of characters on each line
        const lines = code.split("\n");
        // +1 to account for the newline character
        const lineLengths: Array<number> = lines.map(line => line.length + 1);
        // Account for the fact that the last string doesn't have a newline character
        // at the end
        lineLengths[lineLengths.length - 1] -= 1;

        let lineLengthCumSum = lineLengths.map((sum => value => sum += value)(0));
        lineLengthCumSum = [0].concat(lineLengthCumSum);

        node.startLine = 0;
        node.startCol = 0;
        this.updateRegionsImpl(node, code, lines, lineLengthCumSum, lines.length - 1, lineLengths[lines.length - 1]);
    }

    static updateRegionsImpl(node: AstNode, code: string, lines: Array<string>, lineLengthCumSum: Array<any>, endLine: number, endCol: number) {
        if (node.endLine === undefined) {
            node.endLine = endLine;
            node.endCol = endCol;
        }

        // Set start and end for each child. We have to iterate backwards.
        let children: Array<AstNode> = [...node.children];
        children.reverse();
        children.forEach(child => {
            this.updateRegionsImpl(child, code, lines, lineLengthCumSum, endLine, endCol);
            endLine = child.startLine;
            endCol = child.startCol;
        });

        // Get linear indices
        node.start = this.getIndex(node.startLine, node.startCol, lineLengthCumSum);
        node.end = this.getIndex(node.endLine, node.endCol, lineLengthCumSum);

        // Ignore whitespace and comments at end
        let s = code.substring(node.start, node.end);

        // Pull whitespace off the end of the string
        s = s.trimEnd();

        // Remove comments from end
        let l = s.split("\n");
        while (l.at(-1)?.trimStart().startsWith("#")) {
            l.pop();
        }
        s = l.join("\n");
        node.end = node.start + s.length - 1;

        // delete child attribute if there are no children
        //   note: makes d3 easier to work with
        if (node.children.length === 0) {
            node.children = undefined;
        }
    }
}

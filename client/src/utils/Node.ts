export type Node = {
    id: number;
    startIndex: number;
    length: number;
    name: string;
    tparent?: number;
    dparent?: number;
    tchild?: number;
    dchild?: number;
    derived: boolean;
    children: Node[];
    state?: number;
    collapse?: boolean;
    newLCollapse?: boolean;
    newRCollapse?: boolean;
    combSiblings?: boolean;
    _children?: Node[];
}

export function getSize(node: Node): number {
    if (node.name == "EMPTY") {
        return 0;
    }
    if (node.name == "UNCOMPILABLE") {
        return null;
    }
    let size = 1;
    if (node.children != undefined) {
        for (const child of node.children) {
            size += getSize(child);
        }
    }
    return size;
}

export function getHeight(node: Node): number | null {
    if (node.name == "EMPTY") {
        return 0;
    }
    if (node.name == "UNCOMPILABLE") {
        return null;
    }
    let height = 0;
    for (const child of node.children) {
        height = Math.max(height, getHeight(child));
    }
    height++;
    return height;


}
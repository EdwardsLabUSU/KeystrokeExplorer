export class Edit {
    public location: number = 0;
    public insertText: string = "";
    public deleteText: string = "";

    constructor(location: number, insertText: string, deleteText: string) {
        this.location = location;
        this.insertText = insertText;
        this.deleteText = deleteText;
    }
}

export class CodeHighlight {
    public startLineNumber: number = 0;
    public startColumn: number = 0;
    public endLineNumber: number = 0;
    public endColumn: number = 0;
}
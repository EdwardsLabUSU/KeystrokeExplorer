import initSqlJs, { Database } from "sql.js";
import { DataFrame } from "data-forge";

// Mirrors the dynamicTyping logic from your CSV config —
// EventID, SourceLocation, ClientTimestamp stay as numbers; everything else is a string.
const NUMERIC_COLUMNS = new Set([
  "EventID",
  "SourceLocation",
  "ClientTimestamp",
//   "X-UserActionID",
]);

function coerce(col: string, value: string | null): string | number | null {
  if (value === null || value === "") return NUMERIC_COLUMNS.has(col) ? null : "";
  if (NUMERIC_COLUMNS.has(col)) {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Row builders — mirror prog_snap_2.py exactly
// ---------------------------------------------------------------------------

const HEADERS = [
  "",
  "EventID",
  "SubjectID",
  "AssignmentID",
  "CodeStateSection",
  "EventType",
  "SourceLocation",
  "EditType",
  "InsertText",
  "DeleteText",
  "X-Metadata",
  "ClientTimestamp",
  "ToolInstances",
  "CodeStateID",
//   "X-UserActionID",
];

function makeRow(values: (string | number | null)[]): Record<string, string | number | null> {
  const row: Record<string, string | number | null> = {};
  HEADERS.forEach((h, i) => {
    row[h] = coerce(h, values[i] == null ? null : String(values[i]));
  });
  return row;
}

function codeStateSection(rawPath: string): string {
  return rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
}

function rowFromFileInit(
  file: { id: number; path: string; initialContent: string },
  assignmentId: string,
  studentName: string
): Record<string, string | number | null> {
  return makeRow([
    "",
    file.id,
    studentName,
    assignmentId,
    codeStateSection(file.path),
    "File.Edit",
    "0",
    "",
    file.initialContent,
    "",
    "FileInit",
    "0",
    "",
    "",
    "",
  ]);
}

function rowFromEdit(
  // edit: { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; userActionId: number; reverted: number },
  edit: { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; reverted: number },
  filePath: string,
  assignmentId: string,
  studentName: string
): Record<string, string | number | null> {
  return makeRow([
    "",
    edit.id,
    studentName,
    assignmentId,
    codeStateSection(filePath),
    "File.Edit",
    edit.sourceLocation,
    "",
    edit.insertText,
    edit.deleteText,
    `reverted: ${edit.reverted}`,
    edit.clientTimestamp,
    "",
    codeStateSection(filePath),
    // edit.userActionId,
  ]);
}

function rowFromAction(
  action: { id: number; clientTimestamp: number; name: string; metadata: string },
  assignmentId: string,
  studentName: string
): Record<string, string | number | null> {
  return makeRow([
    "",
    action.id,
    studentName,
    assignmentId,
    "",
    "X-UserAction",
    -1,
    action.name,
    "",
    "",
    action.metadata,
    action.clientTimestamp,
    "",
    "",
    action.id,
  ]);
}

// ---------------------------------------------------------------------------
// Main conversion — mirrors convert_sqlite.py
// ---------------------------------------------------------------------------

function convertDb(
  db: Database,
  assignmentName: string,
  studentName: string
): Record<string, string | number | null>[] {
  const rows: Record<string, string | number | null>[] = [];

  // Read ProjectFiles
  const filesResult = db.exec("SELECT * FROM ProjectFiles");
  const files: Record<number, { id: number; path: string; initialContent: string }> = {};
  if (filesResult.length > 0) {
    for (const row of filesResult[0].values) {
      const [id, path, initialContent] = row as [number, string, string];
      files[id] = { id, path, initialContent: initialContent ?? "" };
    }
  }

  // Read Edits
//   const editsResult = db.exec("SELECT id, insertText, deleteText, sourceLocation, clientTimestamp, projectFile, userActionId, reverted FROM Edits");
  const editsResult = db.exec("SELECT id, insertText, deleteText, sourceLocation, clientTimestamp, projectFile, reverted FROM Edits");

  const edits: ReturnType<typeof rowFromEdit> extends infer R ? never : never extends never
    // ? { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; userActionId: number; reverted: number }[]
    ? { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; reverted: number }[]

    : never[] = [];
//   type EditRow = { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; userActionId: number; reverted: number };
  type EditRow = { id: number; insertText: string; deleteText: string; sourceLocation: number; clientTimestamp: number; projectFileId: number; reverted: number };
  const editRows: EditRow[] = [];
  if (editsResult.length > 0) {
    for (const row of editsResult[0].values) {
    //   const [id, insertText, deleteText, sourceLocation, clientTimestamp, projectFile, userActionId, reverted] = row as [number, string, string, number, number, number, number, number];
    //   editRows.push({ id, insertText: insertText ?? "", deleteText: deleteText ?? "", sourceLocation, clientTimestamp, projectFileId: projectFile, userActionId, reverted });
      const [id, insertText, deleteText, sourceLocation, clientTimestamp, projectFile, reverted] = row as [number, string, string, number, number, number, number, number];
      editRows.push({ id, insertText: insertText ?? "", deleteText: deleteText ?? "", sourceLocation, clientTimestamp, projectFileId: projectFile, reverted });

    }
  }

  // Read UserActions
  type ActionRow = { id: number; clientTimestamp: number; name: string; metadata: string };
  const actionRows: ActionRow[] = [];
  const actionsResult = db.exec("SELECT id, clientTimestamp, name, metadata FROM UserActions");
  if (actionsResult.length > 0) {
    for (const row of actionsResult[0].values) {
      const [id, clientTimestamp, name, metadata] = row as [number, number, string, string];
      actionRows.push({ id, clientTimestamp, name: name ?? "", metadata: metadata ?? "" });
    }
  }

  // FileInit rows (one per file, timestamp=0 — mirrors convert_sqlite.py)
  for (const file of Object.values(files)) {
    rows.push(rowFromFileInit(file, assignmentName, studentName));
  }

  // Edit + Action rows, sorted by (clientTimestamp, sourceLocation) — mirrors convert_sqlite.py
  const combined: { clientTimestamp: number; sourceLocation: number; row: Record<string, string | number | null> }[] = [
    ...editRows.map(e => ({
      clientTimestamp: e.clientTimestamp,
      sourceLocation: e.sourceLocation,
      row: rowFromEdit(e, files[e.projectFileId]?.path ?? "", assignmentName, studentName),
    })),
    ...actionRows.map(a => ({
      clientTimestamp: a.clientTimestamp,
      sourceLocation: -1,
      row: rowFromAction(a, assignmentName, studentName),
    })),
  ];
  combined.sort((a, b) =>
    a.clientTimestamp !== b.clientTimestamp
      ? a.clientTimestamp - b.clientTimestamp
      : a.sourceLocation - b.sourceLocation
  );
  for (const { row } of combined) rows.push(row);

  return rows;
}

// ---------------------------------------------------------------------------
// Public API — matches what handleFileChange produces
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for the CSV upload path.
 *
 * Usage:
 *   const editsDf = await convertSqliteToDataFrame(file, "assignment_0", "student");
 *   setFilteredFile(editsDf);
 */
export async function convertSqliteToDataFrame(
  file: File,
  assignmentName = "assignment_0",
  studentName = "student"
): Promise<DataFrame> {
  // Load sql.js (WASM). Point locateFile at a CDN or your own public/ dir.
  const SQL = await initSqlJs({
    locateFile: () => "/sql-wasm.wasm",
  });

  const buffer = await file.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buffer));

  const allRows = convertDb(db, assignmentName, studentName);
  db.close();

  const df = new DataFrame(allRows);
  return df.where(
    (row) => row.EventType === "File.Edit" || row.EventType === "X-FileInit"
  );
}
import { readTab, appendRow, updateRow } from "./client";
import type { LeadFile, FileStatus } from "@/types";

const TAB = "Files";
const HEADERS = [
  "FileID",
  "Filename",
  "Status",
  "AssignedTo",
  "UploadedAt",
  "AssignedAt",
  "CompletedAt",
];

function rowToFile(row: Record<string, any>): LeadFile & { _row: number } {
  return {
    fileId: row.FileID,
    filename: row.Filename,
    status: row.Status as FileStatus,
    assignedTo: row.AssignedTo,
    uploadedAt: row.UploadedAt,
    assignedAt: row.AssignedAt,
    completedAt: row.CompletedAt,
    _row: row._row,
  };
}

export async function getAllFiles() {
  const rows = await readTab(TAB);
  return rows.map(rowToFile);
}

export async function getFileById(fileId: string) {
  const files = await getAllFiles();
  return files.find((f) => f.fileId === fileId) || null;
}

export async function createFile(file: LeadFile) {
  await appendRow(TAB, HEADERS, {
    FileID: file.fileId,
    Filename: file.filename,
    Status: file.status,
    AssignedTo: file.assignedTo,
    UploadedAt: file.uploadedAt,
    AssignedAt: file.assignedAt,
    CompletedAt: file.completedAt,
  });
}

export async function updateFile(fileId: string, patch: Partial<LeadFile>) {
  const file = await getFileById(fileId);
  if (!file) throw new Error("File not found");
  const merged = { ...file, ...patch };
  await updateRow(TAB, (file as any)._row, HEADERS, {
    FileID: merged.fileId,
    Filename: merged.filename,
    Status: merged.status,
    AssignedTo: merged.assignedTo,
    UploadedAt: merged.uploadedAt,
    AssignedAt: merged.assignedAt,
    CompletedAt: merged.completedAt,
  });
}

/** Oldest file still in Queue, ordered by UploadedAt ascending. */
export async function getOldestQueuedFile() {
  const files = await getAllFiles();
  const queued = files.filter((f) => f.status === "Queue");
  queued.sort(
    (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  );
  return queued[0] || null;
}

import { readTab, appendRow, updateRow } from "./client";
import type { Assignment, AssignmentStatus } from "@/types";

const TAB = "Assignments";
const HEADERS = [
  "AssignmentID",
  "FileID",
  "UserID",
  "AssignedAt",
  "CompletedAt",
  "Status",
];

function rowToAssignment(row: Record<string, any>): Assignment & { _row: number } {
  return {
    assignmentId: row.AssignmentID,
    fileId: row.FileID,
    userId: row.UserID,
    assignedAt: row.AssignedAt,
    completedAt: row.CompletedAt,
    status: row.Status as AssignmentStatus,
    _row: row._row,
  };
}

export async function getAllAssignments() {
  const rows = await readTab(TAB);
  return rows.map(rowToAssignment);
}

export async function getActiveAssignmentForUser(userId: string) {
  const assignments = await getAllAssignments();
  return (
    assignments.find((a) => a.userId === userId && a.status === "Active") || null
  );
}

export async function createAssignment(assignment: Assignment) {
  await appendRow(TAB, HEADERS, {
    AssignmentID: assignment.assignmentId,
    FileID: assignment.fileId,
    UserID: assignment.userId,
    AssignedAt: assignment.assignedAt,
    CompletedAt: assignment.completedAt,
    Status: assignment.status,
  });
}

export async function completeAssignment(assignmentId: string) {
  const assignments = await getAllAssignments();
  const assignment = assignments.find((a) => a.assignmentId === assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  const completedAt = new Date().toISOString();
  await updateRow(TAB, (assignment as any)._row, HEADERS, {
    AssignmentID: assignment.assignmentId,
    FileID: assignment.fileId,
    UserID: assignment.userId,
    AssignedAt: assignment.assignedAt,
    CompletedAt: completedAt,
    Status: "Completed",
  });
  return completedAt;
}

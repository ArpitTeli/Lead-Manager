import { nanoid } from "nanoid";
import {
  getActiveAssignmentForUser,
  createAssignment,
  completeAssignment,
} from "@/lib/sheets/assignments";
import { getOldestQueuedFile, updateFile, getFileById } from "@/lib/sheets/files";
import { logActivity } from "@/lib/logger";

/**
 * Implements the "Get Next Sheet" flow:
 * 1. If the user already has an active assignment, return it.
 * 2. Otherwise find the oldest Queue file, assign it, and log it.
 */
export async function getNextSheetForUser(userId: string) {
  const existing = await getActiveAssignmentForUser(userId);
  if (existing) {
    const file = await getFileById(existing.fileId);
    return { assignment: existing, file };
  }

  const file = await getOldestQueuedFile();
  if (!file) {
    return { assignment: null, file: null };
  }

  const now = new Date().toISOString();

  await updateFile(file.fileId, {
    status: "Assigned",
    assignedTo: userId,
    assignedAt: now,
  });

  const assignment = {
    assignmentId: nanoid(12),
    fileId: file.fileId,
    userId,
    assignedAt: now,
    completedAt: "",
    status: "Active" as const,
  };
  await createAssignment(assignment);

  await logActivity(userId, "ASSIGNED", `File ${file.filename} (${file.fileId})`);

  const updatedFile = await getFileById(file.fileId);
  return { assignment, file: updatedFile };
}

export async function markSheetComplete(userId: string) {
  const active = await getActiveAssignmentForUser(userId);
  if (!active) {
    throw new Error("No active assignment for this user");
  }

  const completedAt = await completeAssignment(active.assignmentId);

  await updateFile(active.fileId, {
    status: "Completed",
    completedAt,
  });

  await logActivity(userId, "COMPLETED", `File ID ${active.fileId}`);

  return { fileId: active.fileId, completedAt };
}

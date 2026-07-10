export type Role = "Admin" | "LQ";

export interface User {
  userId: string;
  password: string;
  name: string;
  role: Role;
  active: boolean;
}

export type FileStatus = "Queue" | "Assigned" | "Completed";

export interface LeadFile {
  fileId: string;
  filename: string;
  status: FileStatus;
  assignedTo: string;
  uploadedAt: string;
  assignedAt: string;
  completedAt: string;
}

export type AssignmentStatus = "Active" | "Completed";

export interface Assignment {
  assignmentId: string;
  fileId: string;
  userId: string;
  assignedAt: string;
  completedAt: string;
  status: AssignmentStatus;
}

export interface ActivityLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  details: string;
}

export interface SessionPayload {
  userId: string;
  name: string;
  role: Role;
}

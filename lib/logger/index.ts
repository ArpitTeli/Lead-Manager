import { appendRow } from "@/lib/sheets/client";

const TAB = "ActivityLog";
const HEADERS = ["Timestamp", "UserID", "Action", "Details"];

export async function logActivity(userId: string, action: string, details: string = "") {
  try {
    await appendRow(TAB, HEADERS, {
      Timestamp: new Date().toISOString(),
      UserID: userId,
      Action: action,
      Details: details,
    });
  } catch (err) {
    // Logging failures should never break the primary request flow.
    console.error("Failed to write activity log:", err);
  }
}

// Sync Vercel Blob files into the Sheet.
// Usage: node scripts/sync-blob.mjs
//
// This lists all blobs, checks which ones are already in the Sheet,
// and adds missing entries.

import { list } from "@vercel/blob";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { nanoid } from "nanoid";

// --- Config ---
const KEY_FILE = "./strata-501110-30e77262c7bb.json";
const SHEET_ID = "1yVbvSHRnR2nNxqn8eT_x4qmmFgoyx3CMiL-fGaEOqJM";

// --- Sheets setup ---
const key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// --- Read existing Sheet data ---
async function getExistingStorageUrls() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Files!A1:J200",
  });
  const rows = res.data.values || [];
  const urls = new Set();
  for (let i = 1; i < rows.length; i++) {
    const storageUrl = (rows[i][3] || "").trim();
    if (storageUrl) urls.add(storageUrl);
    // Also check if fileId is an old-style URL
    const fileId = (rows[i][0] || "").trim();
    if (fileId.startsWith("http")) urls.add(fileId);
  }
  return urls;
}

async function getHeaders() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Files!A1:J1",
  });
  return res.data.values?.[0] || [];
}

// --- Main ---
async function main() {
  console.log("Listing blobs...");
  let allBlobs = [];
  let cursor;

  do {
    const result = await list({ cursor, limit: 100 });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Found ${allBlobs.length} blobs total`);

  const existingUrls = await getExistingStorageUrls();
  const headers = await getHeaders();
  console.log(`Existing Sheet entries: ${existingUrls.size}`);

  const newRows = [];

  for (const blob of allBlobs) {
    if (existingUrls.has(blob.url)) {
      console.log(`  Already tracked: ${blob.pathname}`);
      continue;
    }

    // Parse the blob pathname to extract filename and folder path
    // Blob pathname format: "nanoid-filename" or "folder/nanoid-filename"
    const pathname = blob.pathname || "";
    
    // Extract folder path and clean filename
    let folderPath = "";
    let cleanName = pathname;

    // Remove nanoid prefix (12 chars + dash) if present
    const nameMatch = pathname.match(/^(.+\/)?[a-zA-Z0-9_-]{12}-(.+)$/);
    if (nameMatch) {
      folderPath = (nameMatch[1] || "").replace(/\/$/, "");
      cleanName = nameMatch[2];
    } else {
      // No nanoid prefix — use full name, check for embedded path
      const lastSlash = pathname.lastIndexOf("/");
      if (lastSlash > 0) {
        folderPath = pathname.substring(0, lastSlash);
        cleanName = pathname.substring(lastSlash + 1);
      }
    }

    const fileId = nanoid(12);
    const now = new Date().toISOString();

    newRows.push([
      fileId,          // FileID
      cleanName,       // Filename
      folderPath,      // FolderPath
      blob.url,        // StorageUrl
      "Queue",         // Status
      "",              // AssignedTo
      now,             // UploadedAt
      "",              // AssignedAt
      "",              // CompletedAt
    ]);

    console.log(`  NEW: ${cleanName} -> folder: ${folderPath || "(root)"}`);
  }

  if (newRows.length === 0) {
    console.log("\nNo new files to add.");
    return;
  }

  // Append new rows to the Sheet
  console.log(`\nAdding ${newRows.length} new rows to Sheet...`);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Files!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: newRows },
  });

  console.log("Done! Refreshing the page should now show all files.");
}

main().catch(console.error);

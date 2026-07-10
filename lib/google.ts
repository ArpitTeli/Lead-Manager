import { google } from "googleapis";

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY || "";
  // Handles keys stored with literal \n in env vars (common on Vercel).
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: getPrivateKey(),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

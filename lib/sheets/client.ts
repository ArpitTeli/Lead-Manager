import { getSheetsClient } from "@/lib/google";

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID as string;

/**
 * Reads all rows from a tab (row 1 assumed to be headers).
 * Returns array of objects keyed by header name, plus a hidden
 * `_row` field with the 1-indexed sheet row number for updates.
 */
export async function readTab(tabName: string): Promise<Record<string, any>[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A1:Z10000`,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row, idx) => {
    const obj: Record<string, any> = { _row: idx + 2 };
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

export async function appendRow(tabName: string, headers: string[], values: Record<string, any>) {
  const sheets = getSheetsClient();
  const row = headers.map((h) => (values[h] ?? "").toString());
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export async function updateRow(
  tabName: string,
  rowNumber: number,
  headers: string[],
  values: Record<string, any>
) {
  const sheets = getSheetsClient();
  const row = headers.map((h) => (values[h] ?? "").toString());
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A${rowNumber}:${colLetter(headers.length)}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

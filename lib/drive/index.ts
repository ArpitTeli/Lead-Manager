import { getDriveClient } from "@/lib/google";
import { Readable } from "stream";

const ROOT_FOLDER_ID = () => process.env.GOOGLE_DRIVE_FOLDER_ID as string;

export async function uploadFile(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  parentFolderId?: string
) {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [parentFolderId || ROOT_FOLDER_ID()],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, name",
    supportsAllDrives: true,
  });
  return res.data.id as string;
}

/**
 * Ensures a folder path exists under rootFolder, creating any missing
 * subfolders along the way. Returns the Drive folder ID of the deepest
 * subfolder.
 *
 * e.g. ensureFolder("Region A/City 1") creates
 *   ROOT/Region A/ -> ROOT/Region A/City 1/
 * and returns the ID of "City 1".
 */
export async function ensureFolder(folderPath: string): Promise<string> {
  const drive = getDriveClient();
  const parts = folderPath.split("/").filter(Boolean);
  let parentId = ROOT_FOLDER_ID();

  for (const part of parts) {
    // Search for an existing folder with this name under the current parent
    const search = await drive.files.list({
      q: `name = '${part.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (search.data.files && search.data.files.length > 0) {
      parentId = search.data.files[0].id!;
    } else {
      // Create the folder
      const created = await drive.files.create({
        requestBody: {
          name: part,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
        fields: "id",
        supportsAllDrives: true,
      });
      parentId = created.data.id!;
    }
  }

  return parentId;
}

export async function downloadFile(driveFileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function deleteFile(driveFileId: string) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId: driveFileId, supportsAllDrives: true });
}

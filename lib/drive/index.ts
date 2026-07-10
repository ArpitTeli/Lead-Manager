import { getDriveClient } from "@/lib/google";
import { Readable } from "stream";

const FOLDER_ID = () => process.env.GOOGLE_DRIVE_FOLDER_ID as string;

export async function uploadFile(filename: string, buffer: Buffer, mimeType: string) {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [FOLDER_ID()],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, name",
  });
  return res.data.id as string;
}

export async function downloadFile(driveFileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function deleteFile(driveFileId: string) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId: driveFileId });
}

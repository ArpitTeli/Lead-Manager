"use client";

import { useEffect, useState } from "react";

interface FileInfo {
  fileId: string;
  filename: string;
  folderPath: string;
  status: string;
  uploadedAt: string;
}

export default function DashboardClient() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadFiles() {
    setLoading(true);
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setFiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load files");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Lead Sheets</h2>
          <p className="mt-1 text-sm text-black/50">
            Browse and download available lead sheets.
          </p>
        </div>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-ink hover:bg-black/5 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-black/50">Loading files...</p>
      ) : files.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-black/50">No sheets uploaded yet. Check back later.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/50">
                <th className="py-2 pr-3 font-medium">Filename</th>
                <th className="py-2 pr-3 font-medium">Folder</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Uploaded</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.fileId} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="py-2.5 pr-3 max-w-[250px] truncate font-medium text-ink">
                    {f.filename}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-black/40">
                    {f.folderPath || "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.status === "Queue"
                          ? "bg-yellow-100 text-yellow-800"
                          : f.status === "Assigned"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-black/50">
                    {new Date(f.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5">
                    <a
                      href={`/api/download/${f.fileId}`}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

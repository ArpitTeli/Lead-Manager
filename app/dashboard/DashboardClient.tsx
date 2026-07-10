"use client";

import { useEffect, useState } from "react";
import FileTree from "@/components/FileTree";

export default function DashboardClient() {
  const [files, setFiles] = useState<any[]>([]);
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
            Browse folders and download lead sheets.
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
      ) : (
        <FileTree files={files} />
      )}
    </div>
  );
}

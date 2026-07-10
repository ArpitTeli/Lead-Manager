"use client";

import { useState } from "react";

interface FileInfo {
  fileId: string;
  filename: string;
  status: string;
  assignedAt: string;
}

export default function DashboardClient() {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function getNextSheet() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/get-next-sheet", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get next sheet");
        return;
      }
      if (!data.file) {
        setMessage("No files available in the queue right now.");
        setFile(null);
        return;
      }
      setFile(data.file);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mark-complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to mark complete");
        return;
      }
      setMessage("Marked as complete. Great work!");
      setFile(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-ink">Your Sheet</h2>
      <p className="mb-6 text-sm text-black/50">
        Get your next lead sheet, work through it, then mark it complete.
      </p>

      {!file && (
        <button
          onClick={getNextSheet}
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get Next Sheet"}
        </button>
      )}

      {file && (
        <div className="space-y-4">
          <div className="rounded-md border border-black/10 bg-paper p-4">
            <p className="text-sm font-medium text-ink">{file.filename}</p>
            <p className="mt-1 text-xs text-black/50">Status: {file.status}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/download/${file.fileId}`}
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-ink hover:bg-black/5"
            >
              Download
            </a>
            <button
              onClick={markComplete}
              disabled={loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Mark Complete"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}

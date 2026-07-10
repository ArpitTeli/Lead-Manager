"use client";

import { useEffect, useState } from "react";

type Tab = "upload" | "files" | "stats" | "users";

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["upload", "files", "stats", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "bg-ink text-white"
                : "border border-black/15 text-black/70 hover:bg-black/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "upload" && <UploadPanel />}
      {tab === "files" && <FilesPanel />}
      {tab === "stats" && <StatsPanel />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}

function UploadPanel() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"files" | "folder">("files");

  async function handleUpload() {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    setResults([]);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setResults(data.results || []);
      setFiles(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  const fileList = files ? Array.from(files) : [];

  return (
    <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-ink">Upload Lead Sheets</h2>
      <p className="mb-6 text-sm text-black/50">
        Upload Excel files individually or select an entire folder to preserve its structure.
      </p>

      {/* Mode toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setMode("files"); setFiles(null); }}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            mode === "files"
              ? "bg-ink text-white"
              : "border border-black/15 text-black/70 hover:bg-black/5"
          }`}
        >
          Select Files
        </button>
        <button
          onClick={() => { setMode("folder"); setFiles(null); }}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            mode === "folder"
              ? "bg-ink text-white"
              : "border border-black/15 text-black/70 hover:bg-black/5"
          }`}
        >
          Select Folder
        </button>
      </div>

      {/* File / Folder picker */}
      {mode === "files" ? (
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="mb-4 block text-sm"
        />
      ) : (
        <input
          type="file"
          // @ts-ignore -- webkitdirectory is a non-standard attribute for folder selection
          webkitdirectory=""
          directory=""
          onChange={(e) => setFiles(e.target.files)}
          className="mb-4 block text-sm"
        />
      )}

      {/* Selected file summary */}
      {fileList.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer text-xs text-black/60 hover:text-black/80">
            {fileList.length} file(s) selected
          </summary>
          <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs text-black/50">
            {fileList.slice(0, 50).map((f, i) => (
              <li key={i}>
                {(f as any).webkitRelativePath || f.name}
              </li>
            ))}
            {fileList.length > 50 && (
              <li className="italic">...and {fileList.length - 50} more</li>
            )}
          </ul>
        </details>
      )}

      <button
        onClick={handleUpload}
        disabled={!files || uploading}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <ul className="mt-6 space-y-2 text-sm">
          {results.map((r, i) => (
            <li key={i} className="rounded-md border border-black/10 bg-paper px-3 py-2">
              <span className="font-medium">{r.filename}</span>
              {r.folderPath && (
                <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs text-black/50">
                  {r.folderPath}
                </span>
              )}
              <span className="ml-2">
                {r.error ? `Error: ${r.error}` : `✅ Queued`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load stats"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-black/50">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Files", value: stats.totals.files },
          { label: "Queue", value: stats.totals.queue },
          { label: "Assigned", value: stats.totals.assigned },
          { label: "Completed", value: stats.totals.completed },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs text-black/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-ink">Lead Qualifier Performance</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Active</th>
              <th className="py-2 font-medium">Total Assigned</th>
              <th className="py-2 font-medium">Completed</th>
              <th className="py-2 font-medium">In Progress</th>
            </tr>
          </thead>
          <tbody>
            {stats.users.map((u: any) => (
              <tr key={u.userId} className="border-b border-black/5">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.active ? "Yes" : "No"}</td>
                <td className="py-2">{u.totalAssigned}</td>
                <td className="py-2">{u.completed}</td>
                <td className="py-2">{u.activeNow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilesPanel() {
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
      .catch(() => { setError("Failed to load files"); setLoading(false); });
  }

  useEffect(() => { loadFiles(); }, []);

  async function handleDelete(fileId: string, filename: string) {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete");
    } else {
      loadFiles();
    }
  }

  if (loading) return <p className="text-sm text-black/50">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">All Files</h3>
        <button
          onClick={loadFiles}
          className="rounded-md border border-black/15 px-3 py-1 text-xs hover:bg-black/5"
        >
          Refresh
        </button>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-black/50">No files uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/50">
                <th className="py-2 pr-2 font-medium">Filename</th>
                <th className="py-2 pr-2 font-medium">Folder</th>
                <th className="py-2 pr-2 font-medium">Status</th>
                <th className="py-2 pr-2 font-medium">Uploaded</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f: any) => (
                <tr key={f.fileId} className="border-b border-black/5">
                  <td className="py-2 pr-2 max-w-[200px] truncate">{f.filename}</td>
                  <td className="py-2 pr-2 text-xs text-black/50">{f.folderPath || "—"}</td>
                  <td className="py-2 pr-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      f.status === "Queue" ? "bg-yellow-100 text-yellow-800" :
                      f.status === "Assigned" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-xs text-black/50">
                    {new Date(f.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 flex gap-1.5">
                    <a
                      href={`/api/download/${f.fileId}`}
                      className="rounded-md border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(f.fileId, f.filename)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
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

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("LQ");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function loadUsers() {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setUsers(data));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, role, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create user");
      return;
    }
    setMessage(`User ${userId} created.`);
    setUserId("");
    setName("");
    setPassword("");
    loadUsers();
  }

  async function toggleActive(u: any) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.userId, active: !u.active }),
    });
    loadUsers();
  }

  async function resetPassword(u: any) {
    const newPassword = window.prompt(`New password for ${u.userId}:`);
    if (!newPassword) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.userId, newPassword }),
    });
    setMessage(`Password reset for ${u.userId}.`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-ink">Create User</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="LQ">Lead Qualifier</option>
            <option value="Admin">Admin</option>
          </select>
          <input
            placeholder="Temporary Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-4"
          >
            Create User
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-ink">All Users</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 font-medium">User ID</th>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Active</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-black/5">
                <td className="py-2">{u.userId}</td>
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.active ? "Yes" : "No"}</td>
                <td className="py-2 space-x-2">
                  <button
                    onClick={() => toggleActive(u)}
                    className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5"
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => resetPassword(u)}
                    className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5"
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

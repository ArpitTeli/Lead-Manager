"use client";

import { useEffect, useState } from "react";

type Tab = "upload" | "stats" | "users";

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["upload", "stats", "users"] as Tab[]).map((t) => (
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

  return (
    <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-ink">Upload Lead Sheets</h2>
      <p className="mb-6 text-sm text-black/50">
        Upload one or more Excel files. They'll be added to the queue automatically.
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="mb-4 block text-sm"
      />

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
              {r.filename} — {r.error ? `Error: ${r.error}` : `Queued (${r.status})`}
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

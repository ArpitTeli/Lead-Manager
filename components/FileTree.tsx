"use client";

import { useState } from "react";

export interface FileItem {
  fileId: string;
  filename: string;
  folderPath: string;
  status: string;
  uploadedAt: string;
}

interface Props {
  files: FileItem[];
  onDelete?: (fileId: string, filename: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  files: FileItem[];
}

/** Build a tree from a flat file list */
function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  for (const f of files) {
    // Determine folder path: prefer folderPath, fall back to extracting from filename
    let folderPath = f.folderPath;
    let cleanFilename = f.filename;

    if (!folderPath) {
      // Check if filename contains embedded path (e.g. "Mumbai/Dermat/file.xlsx")
      const lastSlash = f.filename.lastIndexOf("/");
      if (lastSlash > 0) {
        folderPath = f.filename.substring(0, lastSlash);
        cleanFilename = f.filename.substring(lastSlash + 1);
      }
    }

    // Update file reference with cleaned filename
    (f as any)._cleanName = cleanFilename;

    if (!folderPath) {
      // No folder - add directly to root
      let node = map.get("__root__");
      if (!node) {
        node = { name: "", path: "", children: [], files: [] };
        map.set("__root__", node);
        root.push(node);
      }
      node.files.push(f);
      continue;
    }

    const parts = folderPath.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

      if (!map.has(currentPath)) {
        const node: TreeNode = {
          name: parts[i],
          path: currentPath,
          children: [],
          files: [],
        };
        map.set(currentPath, node);

        if (parentPath && map.has(parentPath)) {
          map.get(parentPath)!.children.push(node);
        } else {
          root.push(node);
        }
      }
    }

    // Add file to the deepest folder
    map.get(currentPath)!.files.push(f);
  }

  // Sort children and files alphabetically
  function sortNode(node: TreeNode) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => a.filename.localeCompare(b.filename));
    node.children.forEach(sortNode);
  }
  root.forEach(sortNode);

  return root;
}

export default function FileTree({ files, onDelete }: Props) {
  const tree = buildTree(files);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renderNode(node: TreeNode, depth: number) {
    const isExpanded = expanded.has(node.path);
    const hasChildren = node.children.length > 0 || node.files.length > 0;
    const paddingLeft = depth * 20;

    return (
      <div key={node.path || "__root__"}>
        {/* Folder header (only if there are children or it's a root-level folder) */}
        {node.name && (
          <button
            onClick={() => toggle(node.path)}
            className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium text-black/70 hover:bg-black/[0.03]"
            style={{ paddingLeft: `${12 + paddingLeft}px` }}
          >
            <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
            <span className="text-sm">📁</span>
            {node.name}
            <span className="ml-auto text-xs text-black/30">
              {node.files.length + node.children.reduce((sum, c) => sum + c.files.length + c.children.length, 0)} items
            </span>
          </button>
        )}

        {/* Children */}
        {(!node.name || isExpanded) && (
          <>
            {node.children.map((child) => renderNode(child, depth + (node.name ? 1 : 0)))}
            {node.files.map((f) => renderFile(f, depth + (node.name ? 1 : 0)))}
          </>
        )}
      </div>
    );
  }

  function renderFile(f: FileItem, depth: number) {
    const paddingLeft = depth * 20;
    return (
      <div
        key={f.fileId}
        className="flex items-center gap-3 border-b border-black/[0.03] px-2 py-2 hover:bg-black/[0.02]"
        style={{ paddingLeft: `${12 + paddingLeft}px` }}
      >
        <span className="text-sm">📄</span>
        <span className="flex-1 truncate text-sm text-ink">{(f as any)._cleanName || f.filename}</span>
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
        <span className="text-xs text-black/40">
          {new Date(f.uploadedAt).toLocaleDateString()}
        </span>
        <a
          href={`/api/download/${f.fileId}`}
          className="rounded-md border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5"
        >
          Download
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(f.fileId, f.filename)}
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    );
  }

  if (files.length === 0) {
    return <p className="py-8 text-center text-sm text-black/50">No files uploaded yet.</p>;
  }

  return (
    <div className="divide-y divide-black/[0.04] rounded-lg border border-black/10 bg-white">
      {tree.map((node) => renderNode(node, 0))}
    </div>
  );
}

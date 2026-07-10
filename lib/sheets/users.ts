import { readTab, appendRow, updateRow } from "./client";
import type { User } from "@/types";

const TAB = "Users";
const HEADERS = ["UserID", "Password", "Name", "Role", "Active"];

function rowToUser(row: Record<string, any>): User & { _row: number } {
  return {
    userId: row.UserID,
    password: row.Password,
    name: row.Name,
    role: row.Role,
    active: String(row.Active).toUpperCase() === "TRUE",
    _row: row._row,
  };
}

export async function getAllUsers() {
  const rows = await readTab(TAB);
  return rows.map(rowToUser);
}

export async function getUserById(userId: string) {
  const users = await getAllUsers();
  return users.find((u) => u.userId === userId) || null;
}

export async function createUser(user: User) {
  await appendRow(TAB, HEADERS, {
    UserID: user.userId,
    Password: user.password,
    Name: user.name,
    Role: user.role,
    Active: user.active ? "TRUE" : "FALSE",
  });
}

export async function setUserPassword(userId: string, password: string) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  await updateRow(TAB, (user as any)._row, HEADERS, {
    UserID: user.userId,
    Password: password,
    Name: user.name,
    Role: user.role,
    Active: user.active ? "TRUE" : "FALSE",
  });
}

export async function setUserActive(userId: string, active: boolean) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  await updateRow(TAB, (user as any)._row, HEADERS, {
    UserID: user.userId,
    Password: user.password,
    Name: user.name,
    Role: user.role,
    Active: active ? "TRUE" : "FALSE",
  });
}

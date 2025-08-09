// lib/authenticate.js
import jwtDecode from "jwt-decode";

export function setToken(token) {
  if (typeof localStorage !== "undefined" && token) {
    localStorage.setItem("token", token);
  }
}

export function getToken() {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function readToken() {
  if (typeof localStorage === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    removeToken();
    return null;
  }
}

export function removeToken() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("token");
  }
}

export function isAuthenticated() {
  return !!getToken();
}

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Invalid JSON from server" };
  }
}

export async function authenticateUser(userName, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (data.token) setToken(data.token);

  return data;
}

export async function registerUser(userName, password, password2) {
  if (password !== password2) {
    throw new Error("Passwords do not match");
  }

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data; 
}

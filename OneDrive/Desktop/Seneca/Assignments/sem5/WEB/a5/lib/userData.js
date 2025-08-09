// lib/userData.js
import { getToken } from "@/lib/authenticate";

async function request(path, { method = "GET", data } = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(path, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text }; }

  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
}


export function getFavourites() {
  return request("/api/user/favourites"); 
}


export function addToFavourites(id) {
  return request("/api/user/favourites", {
    method: "POST",
    data: { action: "add", objectID: String(id) },
  });
}

export function removeFromFavourites(id) {
  return request("/api/user/favourites", {
    method: "POST",
    data: { action: "remove", objectID: String(id) },
  });
}


export function getHistory() {
  return request("/api/user/history"); 
}

export function addToHistory(query) {
  return request("/api/user/history", { method: "POST", data: { query } });
}

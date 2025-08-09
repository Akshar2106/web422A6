// components/MainNav.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Nav, NavDropdown, Form, Button } from "react-bootstrap";
import { isAuthenticated, readToken, removeToken } from "@/lib/authenticate";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { favouritesAtom, searchHistoryAtom } from "@/store";
import { addToHistory } from "@/lib/userData";

export default function MainNav() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [, setFavs] = useAtom(favouritesAtom);
  const [, setHist] = useAtom(searchHistoryAtom);

  useEffect(() => setMounted(true), []);

  const authed = mounted ? isAuthenticated() : false;
  const user = mounted ? readToken() : null;

async function onSearchSubmit(e) {
  e.preventDefault();
  const q = search.trim();
  if (!q) return;

  try { await addToHistory(`searchBy=title&q=${q}`); } catch {}

  router.push(`/artwork?searchBy=title&q=${encodeURIComponent(q)}`);
  setSearch("");
}


  function logout() {
    removeToken();
    setFavs([]);
    setHist([]);
    router.push("/login");
  }

  return (
    <Navbar bg="primary" variant="dark" className="px-3" expand="lg">
      <Link href="/" className="navbar-brand">Aksharkumar Patel</Link>

      <Nav className="me-auto">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/advanced-search" className="nav-link">Advanced Search</Link>
        {authed && <Link href="/favourites" className="nav-link">Favourites</Link>}
        {authed && <Link href="/history" className="nav-link">History</Link>}
      </Nav>

      <Form className="d-flex me-3" onSubmit={onSearchSubmit}>
        <Form.Control
          type="search"
          placeholder="Search"
          className="me-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="light">Search</Button>
      </Form>

      <Nav>
        {authed ? (
          <NavDropdown title={user?.email || user?.userName || "Account"} align="end">
            <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
          </NavDropdown>
        ) : (
          <>
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/register" className="nav-link">Register</Link>
          </>
        )}
      </Nav>
    </Navbar>
  );
}

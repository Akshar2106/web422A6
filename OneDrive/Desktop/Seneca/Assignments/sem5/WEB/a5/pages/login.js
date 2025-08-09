import { useState } from "react";
import { useRouter } from "next/router";
import { authenticateUser } from "@/lib/authenticate";
import { getFavourites, getHistory } from "@/lib/userData";
import { favouritesAtom, searchHistoryAtom } from "@/store";
import { useAtom } from "jotai";
import { Button, Form, Card, Alert } from "react-bootstrap";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [favouritesList, setFavouritesList] = useAtom(favouritesAtom);
  const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom);
  const router = useRouter();

  async function updateAtoms() {
    setFavouritesList(await getFavourites());
    setSearchHistory(await getHistory());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
   
try {
  await authenticateUser(userName, password);
  router.push("/favourites");
  updateAtoms(); 
} catch (err) {
  setWarning(err.message);
} finally {
  setIsSubmitting(false);
}

  }

  return (
    <>
      <Card bg="light">
        <Card.Body>
          <h2>Login</h2>
          <p>Enter your credentials to log in:</p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>User Name:</Form.Label>
              <Form.Control
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password:</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            {warning && <Alert variant="danger">{warning}</Alert>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in…" : "Login"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}

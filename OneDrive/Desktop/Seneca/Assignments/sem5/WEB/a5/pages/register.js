import { useState } from "react";
import { useRouter } from "next/router";
import { registerUser } from "@/lib/authenticate";
import { Button, Form, Card, Alert } from "react-bootstrap";

export default function Register() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [warning, setWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

 async function handleSubmit(e) {
  e.preventDefault();
  setIsSubmitting(true);

  if (password !== password2) {
    setWarning("Passwords do not match");
    setIsSubmitting(false);
    return;
  }

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    router.push("/login");
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
          <h2>Register</h2>
          <p>Create an account:</p>
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

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password:</Form.Label>
              <Form.Control
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            </Form.Group>

            {warning && <Alert variant="danger">{warning}</Alert>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering…" : "Register"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}

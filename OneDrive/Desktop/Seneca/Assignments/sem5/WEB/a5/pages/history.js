import { useEffect, useState } from "react";
import { Card, Button, ListGroup, Spinner, Alert } from "react-bootstrap";
import { getHistory, removeFromHistory, clearHistory } from "@/lib/userData";

export default function HistoryPage() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await getHistory();
      setItems(data);
    } catch (e) {
      setErr(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner className="mt-3" animation="border" />;
  if (err) return <Alert className="mt-3" variant="danger">{err}</Alert>;

  return (
    <Card className="mt-3">
      <Card.Body className="d-flex justify-content-between align-items-center">
        <Card.Title className="mb-0">Search History</Card.Title>
        <Button
          variant="outline-danger"
          size="sm"
          disabled={!items?.length}
          onClick={async () => {
            try { setItems(await clearHistory()); } catch (e) { setErr(e.message); }
          }}
        >
          Clear All
        </Button>
      </Card.Body>
      <ListGroup variant="flush">
        {items?.length ? items.map(h => (
          <ListGroup.Item key={h._id} className="d-flex justify-content-between align-items-center">
            <div>{h.query}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {new Date(h.createdAt).toLocaleString()}
              <Button
                className="ms-3"
                size="sm"
                variant="outline-danger"
                onClick={async () => {
                  try { setItems(await removeFromHistory(h._id)); } catch (e) { setErr(e.message); }
                }}
              >
                Remove
              </Button>
            </div>
          </ListGroup.Item>
        )) : (
          <ListGroup.Item className="text-muted">No history yet.</ListGroup.Item>
        )}
      </ListGroup>
    </Card>
  );
}

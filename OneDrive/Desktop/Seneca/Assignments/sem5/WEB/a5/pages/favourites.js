// pages/favourites.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Button, Row, Col } from "react-bootstrap";
import { useAtom } from "jotai";
import { favouritesAtom } from "@/store";
import { getFavourites, removeFromFavourites } from "@/lib/userData";

export default function FavouritesPage() {
  const [favs, setFavs] = useAtom(favouritesAtom);
  const [details, setDetails] = useState([]); 
  useEffect(() => {
    (async () => {
      try {
        const data = await getFavourites();
        setFavs(data);
      } catch (e) {
        console.error("Load favourites failed:", e.message);
        setFavs([]);
      }
    })();
  }, [setFavs]);

  const ids = useMemo(
    () =>
      (favs || []).map((x) => (typeof x === "string" ? x : String(x.objectID))).filter(Boolean),
    [favs]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (ids.length === 0) {
        setDetails([]);
        return;
      }
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const r = await fetch(
              `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
            );
            const j = await r.json();
            return { ...j, objectID: id };
          })
        );
        if (!cancelled) setDetails(results);
      } catch (e) {
        console.error("Fetch details failed:", e);
        if (!cancelled) setDetails([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!ids.length) {
    return (
      <Card className="mt-3">
        <Card.Body>
          <Card.Title>Nothing Here</Card.Title>
          <Card.Text>Try adding some new artwork to the list.</Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Row className="mt-3" xs={1} sm={2} md={3} lg={4}>
      {details.map((art) => (
        <Col key={art.objectID} className="mb-4">
          <Card className="h-100">
            {art.primaryImageSmall ? (
              <Card.Img variant="top" src={art.primaryImageSmall} alt={art.title || "Artwork"} />
            ) : (
              <div style={{ height: 180 }} /> 
            )}
            <Card.Body>
              <Card.Title>{art.title || "Untitled"}</Card.Title>
              <Card.Text style={{ lineHeight: 1.4 }}>
                <strong>Date:</strong> {art.objectDate || "N/A"}
                <br />
                <strong>Classification:</strong> {art.classification || "N/A"}
                <br />
                <strong>Medium:</strong> {art.medium || "N/A"}
              </Card.Text>

              <div className="d-flex gap-2">
                <Link href={`/artwork/${art.objectID}`} passHref legacyBehavior>
                  <Button variant="outline-secondary">ID: {art.objectID}</Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={async () => {
                    const updated = await removeFromFavourites(art.objectID);
                    setFavs(updated);
                    setDetails((d) => d.filter((x) => String(x.objectID) !== String(art.objectID)));
                  }}
                >
                  Remove
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

import { useRouter } from "next/router";
import useSWR from "swr";
import { Card, Button } from "react-bootstrap";
import Error from "next/error";
import { useAtom } from "jotai";
import { favouritesAtom } from "@/store";
import { addToFavourites, removeFromFavourites } from "@/lib/userData";
import { useEffect, useMemo, useState } from "react";

export default function ArtworkDetail() {
  const router = useRouter();
  const ready = router.isReady;
  const objectIDRaw = router.query.objectID;
  const objectID = useMemo(
    () => (Array.isArray(objectIDRaw) ? objectIDRaw[0] : objectIDRaw) ?? null,
    [objectIDRaw]
  );

  const [favouritesList, setFavouritesList] = useAtom(favouritesAtom);
  const [showAdded, setShowAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const { data, error } = useSWR(
    ready && objectID
      ? `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`
      : null
  );

  useEffect(() => {
    if (!objectID) return;
    setShowAdded(favouritesList?.some((f) =>
      typeof f === "string" ? f === String(objectID) : f.objectID === String(objectID)
    ));
  }, [favouritesList, objectID]);

  async function handleFavouriteClick() {
    if (!objectID) return;
    setSaving(true);
    setErrMsg("");
    try {
      let updated;
      if (showAdded) {
        updated = await removeFromFavourites(String(objectID));
      } else {
        updated = await addToFavourites(String(objectID));
      }
      setFavouritesList(updated);
      setShowAdded(!showAdded);
    } catch (err) {
      setErrMsg(err?.message || "Failed to update favourites");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <Error statusCode={404} />;
  if (!data) return null;

  return (
    <Card>
      {data.primaryImage && <Card.Img variant="top" src={data.primaryImage} />}
      <Card.Body>
        <Card.Title>{data.title || "N/A"}</Card.Title>
        <Card.Text>
          <strong>Date:</strong> {data.objectDate || "N/A"}
          <br />
          <strong>Classification:</strong> {data.classification || "N/A"}
          <br />
          <strong>Medium:</strong> {data.medium || "N/A"}
          <br />
          <strong>Artist:</strong> {data.artistDisplayName || "N/A"}
          <br />
          <strong>Credit Line:</strong> {data.creditLine || "N/A"}
          <br />
          <strong>Dimensions:</strong> {data.dimensions || "N/A"}
        </Card.Text>

        <Button
          variant={showAdded ? "danger" : "outline-primary"}
          onClick={handleFavouriteClick}
          disabled={!objectID || saving}
        >
          {saving
            ? (showAdded ? "Removing…" : "Adding…")
            : (showAdded ? "Remove from Favourites" : "Add to Favourites")}
        </Button>

        {errMsg ? (
          <div style={{ marginTop: 8, color: "crimson", fontSize: 14 }}>{errMsg}</div>
        ) : null}
      </Card.Body>
    </Card>
  );
}

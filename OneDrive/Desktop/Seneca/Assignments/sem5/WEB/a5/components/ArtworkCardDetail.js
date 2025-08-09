import useSWR from 'swr'
import { Card, Button } from 'react-bootstrap'
import Error from 'next/error'
import { useAtom } from 'jotai'
import { favouritesAtom } from '@/store'
import { useState, useEffect } from 'react'

export default function ArtworkCardDetail({ objectID }) {
  const { data, error } = useSWR(objectID ? `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}` : null)

  const [favouritesList, setFavouritesList] = useAtom(favouritesAtom)
  const [showAdded, setShowAdded] = useState(false)

  useEffect(() => {
    setShowAdded(favouritesList.includes(objectID))
  }, [favouritesList, objectID])

  function favouritesClicked() {
    if (showAdded) {
      setFavouritesList(current => current.filter(fav => fav !== objectID))
      setShowAdded(false)
    } else {
      setFavouritesList(current => [...current, objectID])
      setShowAdded(true)
    }
  }

  if (error) return <Error statusCode={404} />
  if (!data) return null

  return (
    <Card>
      {data.primaryImage && <Card.Img variant="top" src={data.primaryImage} />}
      <Card.Body>
        <Card.Title>{data.title || 'N/A'}</Card.Title>
        <Card.Text>
          Date: {data.objectDate || 'N/A'} <br />
          Classification: {data.classification || 'N/A'} <br />
          Medium: {data.medium || 'N/A'} <br /><br />
          Artist: {data.artistDisplayName || 'N/A'}{' '}
          {data.artistDisplayName && data.artistWikidata_URL && (
            <a href={data.artistWikidata_URL} target="_blank" rel="noreferrer">wiki</a>
          )}<br />
          Credit Line: {data.creditLine || 'N/A'} <br />
          Dimensions: {data.dimensions || 'N/A'}
        </Card.Text>

        <Button
          variant={showAdded ? 'primary' : 'outline-primary'}
          onClick={favouritesClicked}
        >
          {showAdded ? '+ Favourite (added)' : '+ Favourite'}
        </Button>
      </Card.Body>
    </Card>
  )
}

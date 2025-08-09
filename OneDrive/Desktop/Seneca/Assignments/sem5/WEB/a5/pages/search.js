import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useAtom } from 'jotai';
import { searchHistoryAtom } from '@/store';
import withAuth from '@/lib/withAuth';
import { addToHistory, getHistory } from '@/lib/userData'; // ⬅️ add this

function Search() {
  const router = useRouter();
  const [, setSearchHistory] = useAtom(searchHistoryAtom);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const submitForm = async (data) => {
    const params = new URLSearchParams();
    params.set('searchBy', data.searchBy);
    if (data.geoLocation) params.set('geoLocation', data.geoLocation);
    if (data.medium) params.set('medium', data.medium);
    if (data.isOnView) params.set('isOnView', 'true');
    if (data.isHighlight) params.set('isHighlight', 'true');
    params.set('q', data.q);

    const queryString = params.toString();

    try {
      await addToHistory(queryString);
      const hist = await getHistory();
      setSearchHistory(hist);
    } catch {
      setSearchHistory((current) => [...current, queryString]);
    }

    router.push(`/artwork?${queryString}`);
  };

  return (
    <Form onSubmit={handleSubmit(submitForm)}>
      <Row className="mb-3">
        <Form.Group as={Col} md={12}>
          <Form.Label>Search Query</Form.Label>
          <Form.Control
            {...register('q', { required: true })}
            className={errors.q ? 'is-invalid' : ''}
          />
          {errors.q && <div className="invalid-feedback">Search Query is required</div>}
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md={4}>
          <Form.Label>Search By</Form.Label>
          <Form.Select {...register('searchBy')}>
            <option value="title">Title</option>
            <option value="tags">Tags</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as={Col} md={4}>
          <Form.Label>Geo Location</Form.Label>
          <Form.Control
            {...register('geoLocation')}
            placeholder='ie: "Europe", "Paris", "China"'
          />
          <Form.Text muted>Case Sensitive String, multiple values separated by |</Form.Text>
        </Form.Group>

        <Form.Group as={Col} md={4}>
          <Form.Label>Medium</Form.Label>
          <Form.Control
            {...register('medium')}
            placeholder='ie: "Paintings", "Ceramics"'
          />
          <Form.Text muted>Case Sensitive String, multiple values separated by |</Form.Text>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="auto">
          <Form.Check type="checkbox" label="Highlighted" {...register('isHighlight')} />
        </Form.Group>
        <Form.Group as={Col} md="auto">
          <Form.Check type="checkbox" label="Currently on View" {...register('isOnView')} />
        </Form.Group>
      </Row>

      <Button type="submit" variant="primary">Submit</Button>
    </Form>
  );
}

export default withAuth(Search);

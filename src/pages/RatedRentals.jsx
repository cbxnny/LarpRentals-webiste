import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Badge, Spinner, Button, Pagination, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getRatedRentals, getRental } from '../api/rentals';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaExternalLinkAlt, FaSearch, FaCommentAlt } from 'react-icons/fa';

const PAGE_SIZE = 15;

function StarBadge({ rating }) {
  return (
    <span style={{ fontFamily: 'var(--mons)' }} className="d-flex align-items-center gap-1 fw-semibold text-warning">
      <FaStar size={13} />
      {Number(rating).toFixed(1)}
    </span>
  );
}

export default function RatedRentals() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [ratings, setRatings] = useState([]);
  const [enriched, setEnriched] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState('');


  const fetchPage = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const res = await getRatedRentals(token);
      const data = res.data;
      const allRatings = Array.isArray(data) ? data : (data.ratings ?? data.data ?? []);
      const totalCount = data.total ?? allRatings.length;
      setTotal(totalCount);

      const start = (p - 1) * PAGE_SIZE;
      const pageSlice = allRatings.slice(start, start + PAGE_SIZE);
      setRatings(pageSlice);
      return pageSlice;
    } catch {
      setError('Failed to load rated rentals. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const enrichRatings = useCallback(async (ratingList) => {
    if (ratingList.length === 0) { setEnriched([]); return; }
    setEnriching(true);
    setEnriched(ratingList.map(r => ({ ...r, rentalId: r.rentalId ?? r.rental_id ?? r.id, rental: null })));

    const results = await Promise.allSettled(
      ratingList.map(async (r) => {
        const rentalId = r.rentalId ?? r.rental_id ?? r.id;
        try {
          const res = await getRental(rentalId);
          return { ...r, rentalId, rental: res.data };
        } catch {
          return { ...r, rentalId, rental: null };
        }
      })
    );
    setEnriched(results.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    setEnriching(false);
  }, []);


  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchPage(page).then(enrichRatings);
  }, [page, token, fetchPage, enrichRatings, navigate]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));
    } catch { return dateStr; }
  };

  const HEADERS = ['Title', 'Rent/wk', 'Type', 'Postcode', 'State', 'Suburb', 'Beds', 'Baths', 'Parking', 'Your Rating', 'Comment', 'Rated On', ''];

  return (
    <div data-aos="fade-up" data-aos-duration="500" style={{ fontFamily: 'var(--mons)', minHeight: 'calc(100vh - 56px)', background: '#f8f9fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '2rem 0 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <Container>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>My Rated Rentals</h2>
          <p style={{ color: '#94a3b8', marginBottom: 0, fontSize: '0.9rem' }}>Properties you have previously rated</p>
        </Container>
      </div>

      <Container className="pb-5 pt-4">
        {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading your rated rentals...</p>
          </div>
        ) : enriched.length === 0 && !enriching ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: 12 }}>
            <Card.Body>
              <div style={{ fontSize: '3rem' }}>⭐</div>
              <h5 className="mt-3">No rated properties yet</h5>
              <p className="text-muted">Browse properties and leave a rating to see them here.</p>
              <Button variant="primary" className="btn1" style={{ borderRadius: 20, paddingInline: 28 }} onClick={() => navigate('/search')}>
                <FaSearch className="me-2" size={13} />Search Rentals
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">
                {total} rated {total === 1 ? 'property' : 'properties'}
                {enriching && <><Spinner size="sm" animation="border" className="ms-2" /><span className="ms-1">Fetching details...</span></>}
              </span>
            </div>

            <Card className="border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead style={{ background: '#1e293b' }}>
                    <tr>
                      {HEADERS.map(h => (
                        <th key={h} style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px', borderRight: '1px solid #334155', background: '#1e293b', color: '#94a3b8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((item, i) => {
                      const r = item.rental;
                      const rating = item.rating ?? item.userRating ?? item.stars;
                      const ratedAt = item.createdAt ?? item.rated_at ?? item.timestamp ?? item.date ?? item.dateTime;

                      const reviewComment = item.comment ?? null;

                      return (
                        <tr
                          key={item.rentalId ?? i}
                          style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                          className="rental-row"
                          onClick={() => navigate(`/rental/${item.rentalId}`)}
                        >
                          <td className="fw-semibold" style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                            {r
                              ? r.title
                              : <span style={{ display: 'inline-block', height: 14, width: '70%', borderRadius: 4, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                            }
                          </td>
                          <td className="text-success fw-semibold" style={{ fontSize: '0.85rem' }}>{r ? `$${r.rent?.toLocaleString()}` : '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r ? <Badge bg="secondary" className="fw-normal">{r.propertyType}</Badge> : '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r?.postcode ?? '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r ? <Badge bg="primary" className="fw-normal">{r.state}</Badge> : '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r?.suburb ?? '—'}</td>
                          <td className="text-center" style={{ fontSize: '0.85rem' }}>{r?.bedrooms ?? '—'}</td>
                          <td className="text-center" style={{ fontSize: '0.85rem' }}>{r?.bathrooms ?? '—'}</td>
                          <td className="text-center" style={{ fontSize: '0.85rem' }}>{r?.parking ?? '—'}</td>
                          <td><StarBadge rating={rating} /></td>
                          {/* NEW: comment column */}
                          <td style={{ maxWidth: 200, fontSize: '0.82rem', color: '#475569' }}>
                            {reviewComment ? (
                              <span className="d-flex align-items-start gap-1" title={reviewComment}>
                                <FaCommentAlt size={11} className="text-muted mt-1 flex-shrink-0" />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, display: 'inline-block' }}>
                                  {reviewComment}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>No comment</span>
                            )}
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(ratedAt)}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              style={{ borderRadius: 6 }}
                              onClick={e => { e.stopPropagation(); navigate(`/rental/${item.rentalId}`); }}
                            >
                              <FaExternalLinkAlt size={11} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                  {Array.from({ length: Math.min(15, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 15) p = i + 1;
                    else if (page <= 8) p = i + 1;
                    else if (page >= totalPages - 7) p = totalPages - 14 + i;
                    else p = page - 7 + i;
                    return <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>{p}</Pagination.Item>;
                  })}
                  <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Container>

      <style>{`
        .rental-row:hover td { background-color: #f0f7ff !important; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
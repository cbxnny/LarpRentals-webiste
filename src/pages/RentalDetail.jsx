import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { Map, Marker } from 'pigeon-maps';
import {
  FaStar, FaRegStar, FaArrowLeft, FaBed, FaBath, FaCar,
  FaMapMarkerAlt, FaHome, FaBuilding, FaShareAlt, FaCheckCircle
} from 'react-icons/fa';
import { getRental, getRating, postRating, searchRentals } from '../api/rentals';
import { useAuth } from '../context/AuthContext';

function StarRatingInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="d-flex gap-1" style={{ fontFamily: 'var(--mons)', fontSize: '2rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ cursor: disabled ? 'default' : 'pointer', color: n <= (hovered || value) ? '#fbbf24' : '#e2e8f0', transition: 'color 0.12s', lineHeight: 1 }}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(n)}
        >
          {n <= (hovered || value) ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="d-flex align-items-start mb-2">
      <span className="text-primary me-2 mt-1">{icon}</span>
      <div>
        <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{value}</div>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label, color }) {
  return (
    <div className={`text-center p-3 rounded-3 bg-${color} bg-opacity-10`}>
      <div className={`text-${color} mb-1`}>{icon}</div>
      <div className={`fs-4 fw-bold text-${color}`}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</div>
    </div>
  );
}

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [pendingRating, setPendingRating] = useState(0);

  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    getRental(id)
      .then(r => {
        setRental(r.data);
        // Load nearby properties in same postcode
        if (r.data?.postcode) {
          searchRentals({ postcode: r.data.postcode, page: 1, sortBy: 'rent', sortDir: 'asc' })
            .then(res => {
              const nearby = (res.data?.data ?? []).filter(p => String(p.id) !== String(id));
              setNearbyProperties(nearby.slice(0, 8));
            })
            .catch(() => { });
        }
      })
      .catch(() => setError('Could not load rental details.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!token || !id) return;
    getRating(id, token)
      .then(r => {
        const rating = r.data?.rating ?? r.data?.userRating ?? 0;
        setUserRating(rating);
        setPendingRating(rating);
      })
      .catch(() => { });
  }, [id, token]);

  const handleRatingSubmit = async () => {
    if (!pendingRating) return;
    setRatingSubmitting(true);
    setRatingError('');
    setRatingSuccess('');
    try {
      await postRating(id, pendingRating, token);
      setUserRating(pendingRating);
      setRatingSuccess('Rating submitted successfully!');
    } catch {
      setRatingError('Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ fontFamily: 'var(--mons)', minHeight: '60vh' }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error || !rental) return (
    <Container className="py-5 text-center">
      <div style={{ fontSize: '3rem' }}>😕</div>
      <h4 className="mt-3">{error || 'Rental not found'}</h4>
      <Button style={{ fontFamily: 'var(--mons)' }} variant="primary" onClick={() => navigate('/search')} className="mt-3">
        Back to Search
      </Button>
    </Container>
  );

  const lat = rental.latitude ?? rental.lat;
  const lng = rental.longitude ?? rental.lng ?? rental.lon;
  const hasMap = lat && lng;
  const avgRating = rental.avgRating ?? rental.rating;
  const ratingCount = rental.ratingCount ?? rental.numRatings ?? 0;
  const nearbyWithCoords = nearbyProperties.filter(p => p.latitude && p.longitude);

  return (
    <div style={{ fontFamily: 'var(--mons)', minHeight: 'calc(100vh - 56px)', background: '#f8f9fa' }}>
      {/* Back bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <Container className="d-flex justify-content-between align-items-center">
          <Button variant="link" className="d-flex align-items-center p-0 text-decoration-none text-secondary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" size={13} />Back to results
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            style={{ borderRadius: 20 }}
            onClick={handleShare}
            className="d-flex align-items-center gap-1"
          >
            {copied ? <><FaCheckCircle size={13} className="text-success" />Copied!</> : <><FaShareAlt size={13} />Share</>}
          </Button>
        </Container>
      </div>

      <Container className="py-4">
        {/* Title bar */}
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <Badge bg="primary">{rental.state}</Badge>
            <Badge bg="secondary">{rental.propertyType}</Badge>
            {avgRating > 0 && (
              <Badge bg="warning" text="dark">
                <FaStar className="me-1" size={11} />{Number(avgRating).toFixed(1)} ({ratingCount})
              </Badge>
            )}
          </div>
          <h1 className="fw-bold mb-1" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: '#0f172a' }}>{rental.title}</h1>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            <FaMapMarkerAlt className="me-1 text-danger" size={13} />
            {[rental.streetAddress, rental.suburb, rental.state, rental.postcode].filter(Boolean).join(', ')}
          </p>
        </div>

        <Row className="g-4">
          {/* Left col */}
          <Col lg={7}>
            {rental.description && (
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                <Card.Body>
                  <h5 className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#0f172a' }}>Description</h5>
                  <p className="text-muted lh-lg" style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: rental.description }} />
                </Card.Body>
              </Card>
            )}

            {/* Stats */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body>
                <h5 className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#0f172a' }}>Property Details</h5>
                <Row className="g-3 mb-4">
                  <Col xs={6} md={4}>
                    <div className="text-center p-3 rounded-3" style={{ background: '#eff6ff' }}>
                      <div className="fs-3 fw-bold" style={{ color: '#3b82f6' }}>${rental.rent?.toLocaleString()}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>per week</div>
                    </div>
                  </Col>
                  {rental.bedrooms != null && (
                    <Col xs={6} md={4}>
                      <StatBox icon={<FaBed size={22} />} value={rental.bedrooms} label="Bedrooms" color="success" />
                    </Col>
                  )}
                  {rental.bathrooms != null && (
                    <Col xs={6} md={4}>
                      <StatBox icon={<FaBath size={22} />} value={rental.bathrooms} label="Bathrooms" color="info" />
                    </Col>
                  )}
                  {rental.parking != null && (
                    <Col xs={6} md={4}>
                      <StatBox icon={<FaCar size={22} />} value={rental.parking} label="Parking" color="warning" />
                    </Col>
                  )}
                </Row>
                <hr className="my-3" />
                <Row className="g-2">
                  <Col md={6}>
                    <InfoItem icon={<FaHome size={13} />} label="Property Type" value={rental.propertyType} />
                    <InfoItem icon={<FaMapMarkerAlt size={13} />} label="Suburb" value={rental.suburb} />
                    <InfoItem icon={<FaMapMarkerAlt size={13} />} label="State" value={rental.state} />
                    <InfoItem icon={<FaMapMarkerAlt size={13} />} label="Postcode" value={rental.postcode} />
                  </Col>
                  <Col md={6}>
                    {rental.agency && <InfoItem icon={<FaBuilding size={13} />} label="Agency" value={rental.agency} />}
                    {rental.streetAddress && <InfoItem icon={<FaMapMarkerAlt size={13} />} label="Street Address" value={rental.streetAddress} />}
                    {rental.amenities && <InfoItem icon={<FaHome size={13} />} label="Amenities" value={rental.amenities} />}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Right col */}
          <Col lg={5}>
            {/* Map — shows current property + nearby in same postcode */}
            {hasMap && (
              <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ borderRadius: 12 }}>
                <Card.Body className="p-0">
                  <Map
                    height={300}
                    center={[parseFloat(lat), parseFloat(lng)]}
                    zoom={nearbyWithCoords.length > 0 ? 13 : 15}
                    attribution={false}
                  >
                    {/* Current property — highlighted */}
                    <Marker width={50} anchor={[parseFloat(lat), parseFloat(lng)]} color="#ef4444" />
                    {/* Nearby properties */}
                    {nearbyWithCoords.map(p => (
                      <Marker
                        key={p.id}
                        width={34}
                        anchor={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                        color="#3b82f6"
                        onClick={() => navigate(`/rental/${p.id}`)}
                      />
                    ))}
                  </Map>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0 py-2 px-3 d-flex align-items-center justify-content-between">
                  <span className="small text-muted">
                    <FaMapMarkerAlt className="text-danger me-1" size={11} />
                    {[rental.suburb, rental.state].filter(Boolean).join(', ')}
                  </span>
                  {nearbyWithCoords.length > 0 && (
                    <span className="small" style={{ color: '#3b82f6' }}>
                      +{nearbyWithCoords.length} nearby · click pins to explore
                    </span>
                  )}
                </Card.Footer>
              </Card>
            )}

            {/* Rating card */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body>
                <h5 className="fw-bold mb-1" style={{ fontSize: '1rem' }}>Community Rating</h5>
                {ratingCount > 0 ? (
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaStar className="text-warning" size={20} />
                      <span className="fs-4 fw-bold">{Number(avgRating).toFixed(1)}</span>
                      <span className="text-muted small">/ 5 ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
                    </div>
                    <div className="d-flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <FaStar key={n} size={17} color={n <= Math.round(avgRating) ? '#fbbf24' : '#e2e8f0'} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted small mb-3">No ratings yet. Be the first!</p>
                )}
                <hr />
                {token ? (
                  <div>
                    <p className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                      {userRating > 0 ? `Your rating: ${userRating}/5 — Update it?` : 'Rate this property:'}
                    </p>
                    <StarRatingInput value={pendingRating} onChange={setPendingRating} disabled={ratingSubmitting} />
                    <Button
                      variant="primary"
                      className="btn1 mt-3 w-100 fw-semibold"
                      style={{ borderRadius: 8 }}
                      onClick={handleRatingSubmit}
                      disabled={!pendingRating || ratingSubmitting}
                    >
                      {ratingSubmitting
                        ? <Spinner size="sm" animation="border" />
                        : (userRating > 0 ? 'Update Rating' : 'Submit Rating')
                      }
                    </Button>
                    {ratingSuccess && <Alert variant="success" className="mt-2 py-2 small rounded-3">{ratingSuccess}</Alert>}
                    {ratingError && <Alert variant="danger" className="mt-2 py-2 small rounded-3">{ratingError}</Alert>}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted small mb-3">Log in to rate this property</p>
                    <Button variant="outline-primary" onClick={() => navigate('/login')} className="w-100" style={{ borderRadius: 8 }}>
                      Login to Rate
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Nearby properties list */}
            {nearbyProperties.length > 0 && (
              <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <Card.Body>
                  <h5 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>
                    <FaMapMarkerAlt className="me-2 text-primary" size={14} />
                    Nearby in {rental.postcode}
                  </h5>
                  <div className="d-flex flex-column gap-2">
                    {nearbyProperties.slice(0, 5).map(p => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/rental/${p.id}`)}
                        style={{
                          cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                          border: '1px solid #e2e8f0', transition: 'all 0.15s', background: '#fff'
                        }}
                        className="nearby-card"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <span className="fw-semibold text-dark" style={{ fontSize: '0.82rem', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </span>
                          <span className="text-success fw-bold" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            ${p.rent?.toLocaleString()}/wk
                          </span>
                        </div>
                        <div className="text-muted d-flex gap-2 mt-1" style={{ fontSize: '0.76rem' }}>
                          <span>{p.propertyType}</span>
                          {p.bedrooms != null && <span>· {p.bedrooms} bed</span>}
                          {p.bathrooms != null && <span>· {p.bathrooms} bath</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="link"
                    className="mt-2 p-0 text-decoration-none small w-100 text-center"
                    onClick={() => navigate(`/search?postcode=${rental.postcode}`)}
                    style={{ color: '#3b82f6' }}
                  >
                    See all in {rental.postcode} →
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      <style>{`
        .nearby-card:hover { border-color: #bfdbfe !important; background: #eff6ff !important; }
      `}</style>
    </div>
  );
}
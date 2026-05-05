import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Badge, Collapse, Card } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Map, Marker } from 'pigeon-maps';
import { getStates, getPropertyTypes, searchRentals } from '../api/rentals';
import {
  FaSearch, FaChevronDown, FaChevronUp, FaStar,
  FaSort, FaSortUp, FaSortDown, FaMap, FaList,
  FaTimesCircle, FaFilter
} from 'react-icons/fa';

const PAGE_SIZE = 10;

/* ─── Tiny helpers ─────────────────────────────────────────────── */
function SortIcon({ column, sortColumn, sortDir }) {
  if (sortColumn !== column) return <FaSort className="ms-1 text-muted opacity-50" size={10} />;
  return sortDir === 'asc'
    ? <FaSortUp className="ms-1 text-primary" size={10} />
    : <FaSortDown className="ms-1 text-primary" size={10} />;
}

function StarDisplay({ rating, count }) {
  if (!count) return <span className="text-muted small fst-italic">— (0)</span>;
  return (
    <span className="small d-flex align-items-center gap-1">
      <FaStar className="text-warning" size={11} />
      <span className="fw-semibold">{Number(rating).toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

/* ─── Virtual / infinite scroll table ─────────────────────────── */
const ROW_HEIGHT = 48;
const OVERSCAN = 5;

function VirtualTable({ columns, rows, onRowClick, sortColumn, sortDir, onSort, loading }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIdx = Math.min(rows.length, startIdx + visibleCount);
  const visibleRows = rows.slice(startIdx, endIdx);
  const totalHeight = rows.length * ROW_HEIGHT;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', fontFamily: 'var(--mons)' }}>
      {/* Sticky header */}
      <div style={{ overflowX: 'auto', background: '#1e293b' }}>
        <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {columns.map(c => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && onSort(col.key)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#cbd5e1',
                    whiteSpace: 'nowrap',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    textAlign: col.align || 'left',
                    borderRight: '1px solid #334155',
                  }}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <SortIcon column={col.key} sortColumn={sortColumn} sortDir={sortDir} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable body */}
      <div
        ref={containerRef}
        onScroll={e => setScrollTop(e.target.scrollTop)}
        style={{ height: Math.min(totalHeight + 2, 520), overflowY: 'auto', overflowX: 'auto', position: 'relative' }}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}>
            <Spinner animation="border" variant="primary" size="sm" />
            <span className="ms-2 text-muted small">Loading...</span>
          </div>
        )}
        <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {columns.map(c => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <tbody>
            {/* spacer above */}
            {startIdx > 0 && (
              <tr style={{ height: startIdx * ROW_HEIGHT }}>
                <td colSpan={columns.length} />
              </tr>
            )}
            {visibleRows.map((row, i) => (
              <tr
                key={row.id ?? (startIdx + i)}
                onClick={() => onRowClick(row)}
                style={{
                  height: ROW_HEIGHT,
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.12s',
                }}
                className="vt-row"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '0 12px',
                      fontSize: '0.83rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: col.align || 'left',
                      color: '#334155',
                    }}
                  >
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {/* spacer below */}
            {endIdx < rows.length && (
              <tr style={{ height: (rows.length - endIdx) * ROW_HEIGHT }}>
                <td colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Map view ─────────────────────────────────────────────────── */
function MapView({ results, onMarkerClick }) {
  const withCoords = results.filter(r => r.latitude && r.longitude);
  if (withCoords.length === 0) {
    return (
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div style={{ fontSize: '2.5rem' }}>🗺️</div>
          <p className="text-muted mt-2">No properties with location data in current results.</p>
        </Card.Body>
      </Card>
    );
  }

  const avgLat = withCoords.reduce((s, r) => s + parseFloat(r.latitude), 0) / withCoords.length;
  const avgLng = withCoords.reduce((s, r) => s + parseFloat(r.longitude), 0) / withCoords.length;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <Map height={520} center={[avgLat, avgLng]} zoom={10} attribution={false}>
        {withCoords.map(r => (
          <Marker
            key={r.id}
            width={36}
            anchor={[parseFloat(r.latitude), parseFloat(r.longitude)]}
            onClick={() => onMarkerClick(r)}
            color="#3b82f6"
          />
        ))}
      </Map>
      <div className="px-3 py-2 bg-white border-top small text-muted">
        Showing {withCoords.length} of {results.length} properties on map · Click a pin to view details
      </div>
    </Card>
  );
}

/* ─── Active filter chips ──────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span
      className="badge d-inline-flex align-items-center gap-1 me-1 mb-1"
      style={{
        background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe',
        fontWeight: 500, fontSize: '0.78rem', padding: '4px 8px', borderRadius: 20
      }}
    >
      {label}
      <FaTimesCircle
        size={11}
        style={{ cursor: 'pointer', opacity: 0.7 }}
        onClick={onRemove}
      />
    </span>
  );
}

/* ─── Main component  */
export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [states, setStates] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('propertyType') || '');
  const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
  const [suburb, setSuburb] = useState(searchParams.get('suburb') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [minBeds, setMinBeds] = useState(searchParams.get('minBedrooms') || '');
  const [maxBeds, setMaxBeds] = useState(searchParams.get('maxBedrooms') || '');
  const [minBaths, setMinBaths] = useState(searchParams.get('minBathrooms') || '');
  const [minParking, setMinParking] = useState(searchParams.get('minParking') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // result state — all rows across ALL pages accumulated for virtual scroll
  const [allRows, setAllRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [sortColumn, setSortColumn] = useState(searchParams.get('sortBy') || 'rent');
  const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  // track current filter params so load-more uses same filters
  const activeFiltersRef = useRef({});

  useEffect(() => {
    getStates().then(r => setStates(r.data)).catch(() => { });
    getPropertyTypes().then(r => setPropertyTypes(r.data)).catch(() => { });

    // auto-search if URL has params
    const hasParams = ['state', 'propertyType', 'postcode', 'suburb', 'minRent', 'maxRent',
      'minBedrooms', 'maxBedrooms', 'minBathrooms', 'minParking', 'sortBy'].some(k => searchParams.get(k));
    if (hasParams) {
      const params = buildParamsFromURL();
      activeFiltersRef.current = params;
      doFreshSearch(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildParamsFromURL() {
    const p = { page: 1, sortBy: searchParams.get('sortBy') || 'rent', sortDir: searchParams.get('sortDir') || 'asc' };
    const state = searchParams.get('state'); if (state) p.state = state;
    const propertyType = searchParams.get('propertyType'); if (propertyType) p.propertyType = propertyType;
    const pc = searchParams.get('postcode'); if (pc) p.postcode = pc;
    const sub = searchParams.get('suburb'); if (sub) p.suburb = sub;
    const minR = searchParams.get('minRent'); if (minR) p.minRent = minR;
    const maxR = searchParams.get('maxRent'); if (maxR) p.maxRent = maxR;
    const minB = searchParams.get('minBedrooms'); if (minB) p.minBedrooms = minB;
    const maxB = searchParams.get('maxBedrooms'); if (maxB) p.maxBedrooms = maxB;
    const minBa = searchParams.get('minBathrooms'); if (minBa) p.minBathrooms = minBa;
    const minP = searchParams.get('minParking'); if (minP) p.minParking = minP;
    return p;
  }

  const buildParams = useCallback((page = 1) => {
    const p = { page, sortBy: sortColumn, sortDir };
    if (selectedState) p.state = selectedState;
    if (selectedType) p.propertyType = selectedType;
    if (postcode) p.postcode = postcode;
    if (suburb) p.suburb = suburb;
    if (minRent) p.minRent = minRent;
    if (maxRent) p.maxRent = maxRent;
    if (minBeds) p.minBedrooms = minBeds;
    if (maxBeds) p.maxBedrooms = maxBeds;
    if (minBaths) p.minBathrooms = minBaths;
    if (minParking) p.minParking = minParking;
    return p;
  }, [sortColumn, sortDir, selectedState, selectedType, postcode, suburb, minRent, maxRent, minBeds, maxBeds, minBaths, minParking]);

  async function doFreshSearch(params) {
    setLoading(true);
    setError('');
    setAllRows([]);
    setCurrentPage(1);
    try {
      const res = await searchRentals({ ...params, page: 1 });
      const data = res.data;
      const rows = data.data ?? [];
      const tot = data.pagination?.total ?? rows.length;
      setAllRows(rows);
      setTotal(tot);
      setHasMore(rows.length < tot);
      setCurrentPage(1);
      setSearched(true);
    } catch {
      setError('Failed to fetch rentals. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreRows() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await searchRentals({ ...activeFiltersRef.current, page: nextPage });
      const newRows = res.data?.data ?? [];
      setAllRows(prev => {
        const combined = [...prev, ...newRows];
        setHasMore(combined.length < total);
        return combined;
      });
      setCurrentPage(nextPage);
    } catch {
      // silently fail, user can try again
    } finally {
      setLoadingMore(false);
    }
  }

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = buildParams(1);
    activeFiltersRef.current = params;
    setSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])));
    doFreshSearch(params);
  };

  const handleSort = (col) => {
    let newDir = 'asc';
    if (sortColumn === col) newDir = sortDir === 'asc' ? 'desc' : 'asc';
    setSortColumn(col);
    setSortDir(newDir);
    const params = { ...activeFiltersRef.current, sortBy: col, sortDir: newDir, page: 1 };
    activeFiltersRef.current = params;
    setSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])));
    doFreshSearch(params);
  };

  // clear a single filter chip
  const clearFilter = (key, setter) => {
    setter('');
    setTimeout(() => {
      const params = buildParams(1);
      delete params[key];
      activeFiltersRef.current = params;
      setSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])));
      doFreshSearch(params);
    }, 0);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (selectedState) chips.push({ label: `State: ${selectedState}`, onRemove: () => clearFilter('state', setSelectedState) });
    if (selectedType) chips.push({ label: `Type: ${selectedType}`, onRemove: () => clearFilter('propertyType', setSelectedType) });
    if (postcode) chips.push({ label: `Postcode: ${postcode}`, onRemove: () => clearFilter('postcode', setPostcode) });
    if (suburb) chips.push({ label: `Suburb: ${suburb}`, onRemove: () => clearFilter('suburb', setSuburb) });
    if (minRent) chips.push({ label: `Min Rent: $${minRent}`, onRemove: () => clearFilter('minRent', setMinRent) });
    if (maxRent) chips.push({ label: `Max Rent: $${maxRent}`, onRemove: () => clearFilter('maxRent', setMaxRent) });
    if (minBeds) chips.push({ label: `Min Beds: ${minBeds}`, onRemove: () => clearFilter('minBedrooms', setMinBeds) });
    if (maxBeds) chips.push({ label: `Max Beds: ${maxBeds}`, onRemove: () => clearFilter('maxBedrooms', setMaxBeds) });
    if (minBaths) chips.push({ label: `Min Baths: ${minBaths}`, onRemove: () => clearFilter('minBathrooms', setMinBaths) });
    if (minParking) chips.push({ label: `Min Parking: ${minParking}`, onRemove: () => clearFilter('minParking', setMinParking) });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedType, postcode, suburb, minRent, maxRent, minBeds, maxBeds, minBaths, minParking]);

  const COLUMNS = [
    {
      key: 'title', label: 'Title', width: '22%',
      render: r => <span className="fw-semibold text-dark">{r.title}</span>
    },
    {
      key: 'rent', label: 'Rent/wk', width: '9%', align: 'right',
      render: r => <span className="text-success fw-bold">${r.rent?.toLocaleString()}</span>
    },
    {
      key: 'propertyType', label: 'Type', width: '10%',
      render: r => <Badge bg="secondary" className="fw-normal">{r.propertyType}</Badge>
    },
    { key: 'suburb', label: 'Suburb', width: '11%' },
    {
      key: 'state', label: 'State', width: '7%', align: 'center',
      render: r => <Badge bg="primary" className="fw-normal">{r.state}</Badge>
    },
    { key: 'postcode', label: 'Postcode', width: '8%', align: 'center' },
    {
      key: 'bedrooms', label: 'Beds', width: '6%', align: 'center',
      render: r => r.bedrooms ?? '—'
    },
    {
      key: 'bathrooms', label: 'Baths', width: '6%', align: 'center',
      render: r => r.bathrooms ?? '—'
    },
    {
      key: 'parking', label: 'Parking', width: '7%', align: 'center',
      render: r => r.parking ?? '—'
    },
    {
      key: 'rating', label: 'Rating', width: '10%', sortable: false,
      render: r => <StarDisplay rating={r.avgRating ?? r.rating} count={r.ratingCount ?? r.numRatings ?? 0} />
    },
    {
      key: 'map', label: '', width: '4%', sortable: false,
      render: r => (r.latitude && r.longitude)
        ? <span title="Has location" style={{ color: '#3b82f6', fontSize: '0.75rem' }}>📍</span>
        : null
    },
  ];

  return (
    <div data-aos="fade-up" data-aos-duration="500" style={{ minHeight: 'calc(100vh - 56px)', background: '#f8f9fa', fontFamily: 'var(--mons)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '2rem 0 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <Container>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>Rental Search</h2>
          <p style={{ color: '#94a3b8', marginBottom: 0, fontSize: '0.9rem' }}>
            Search thousands of Australian rental properties · {searched && total > 0 && <span style={{ color: '#60a5fa' }}>{total.toLocaleString()} results found</span>}
          </p>
        </Container>
      </div>

      <Container className="pb-5 pt-4">
        {/* Filter Card */}
        <Card className="shadow-sm mb-3 border-0" style={{ borderRadius: 12 }}>
          <Card.Body className="p-4">
            <Form onSubmit={handleSearch}>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="fw-semibold small text-muted">State</Form.Label>
                  <Form.Select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ borderRadius: 8 }}>
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold small text-muted">Property Type</Form.Label>
                  <Form.Select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ borderRadius: 8 }}>
                    <option value="">All Types</option>
                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold small text-muted">Postcode</Form.Label>
                  <Form.Control type="text" placeholder="e.g. 4000" value={postcode} onChange={e => setPostcode(e.target.value)} maxLength={4} style={{ borderRadius: 8 }} />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold small text-muted">Suburb</Form.Label>
                  <Form.Control type="text" placeholder="e.g. Brisbane" value={suburb} onChange={e => setSuburb(e.target.value)} style={{ borderRadius: 8 }} />
                </Col>
                <Col md={2} className="d-flex gap-2">
                  <Button type="submit" variant="primary" className="btn1 flex-fill fw-semibold" style={{ borderRadius: 8 }} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : <><FaSearch className="me-2" size={13} />Search</>}
                  </Button>
                </Col>
              </Row>

              <div className="mt-3 d-flex align-items-center gap-2">
                <Button
                  variant="link"
                  className="p-0 text-decoration-none small"
                  style={{ color: '#64748b' }}
                  onClick={() => setShowAdvanced(v => !v)}
                  type="button"
                >
                  <FaFilter size={11} className="me-1" />
                  {showAdvanced ? <><FaChevronUp size={10} className="me-1" />Hide Advanced Filters</> : <><FaChevronDown size={10} className="me-1" />Advanced Filters</>}
                </Button>
                {activeChips.length > 0 && (
                  <Button
                    variant="link"
                    className="p-0 text-decoration-none small text-danger"
                    onClick={() => {
                      setSelectedState(''); setSelectedType(''); setPostcode(''); setSuburb('');
                      setMinRent(''); setMaxRent(''); setMinBeds(''); setMaxBeds('');
                      setMinBaths(''); setMinParking('');
                    }}
                    type="button"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <Collapse in={showAdvanced}>
                <div>
                  <hr className="mt-2 mb-3" />
                  <Row className="g-3">
                    {[
                      ['Min Rent ($/wk)', minRent, setMinRent, 'minRent'],
                      ['Max Rent ($/wk)', maxRent, setMaxRent, 'maxRent'],
                      ['Min Bedrooms', minBeds, setMinBeds, 'minBedrooms'],
                      ['Max Bedrooms', maxBeds, setMaxBeds, 'maxBedrooms'],
                      ['Min Bathrooms', minBaths, setMinBaths, 'minBathrooms'],
                      ['Min Parking', minParking, setMinParking, 'minParking'],
                    ].map(([label, val, setter]) => (
                      <Col md={2} key={label}>
                        <Form.Label className="fw-semibold small text-muted">{label}</Form.Label>
                        <Form.Control
                          type="number" min={0} max={label.includes('Bed') || label.includes('Bath') || label.includes('Park') ? 10 : undefined}
                          placeholder="Any" value={val} onChange={e => setter(e.target.value)} style={{ borderRadius: 8 }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              </Collapse>
            </Form>
          </Card.Body>
        </Card>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="mb-3 d-flex flex-wrap align-items-center">
            <span className="text-muted small me-2">Active filters:</span>
            {activeChips.map((chip, i) => <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />)}
          </div>
        )}

        {/* Error */}
        {error && <div className="alert alert-danger rounded-3">{error}</div>}

        {/* Loading initial */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Searching rentals...</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {/* Results toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                {total === 0
                  ? <span className="text-muted small">No results found</span>
                  : (
                    <span className="text-muted small">
                      Showing <strong>{allRows.length.toLocaleString()}</strong> of <strong>{total.toLocaleString()}</strong> results
                      {hasMore && <span style={{ color: '#3b82f6' }}> · scroll to load more</span>}
                    </span>
                  )
                }
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Sort controls */}
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Sort:</span>
                  <Form.Select
                    size="sm"
                    style={{ width: 'auto', borderRadius: 6 }}
                    value={sortColumn}
                    onChange={e => handleSort(e.target.value)}
                  >
                    {[
                      { key: 'rent', label: 'Rent' },
                      { key: 'bedrooms', label: 'Bedrooms' },
                      { key: 'bathrooms', label: 'Bathrooms' },
                      { key: 'parking', label: 'Parking' },
                      { key: 'postcode', label: 'Postcode' },
                      { key: 'suburb', label: 'Suburb' },
                      { key: 'state', label: 'State' },
                      { key: 'propertyType', label: 'Type' },
                    ].map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </Form.Select>
                  <Form.Select
                    size="sm"
                    style={{ width: 'auto', borderRadius: 6 }}
                    value={sortDir}
                    onChange={e => { setSortDir(e.target.value); handleSort(sortColumn); }}
                  >
                    <option value="asc">↑ Asc</option>
                    <option value="desc">↓ Desc</option>
                  </Form.Select>
                </div>
                {/* View toggle */}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('table')}
                    title="Table view"
                    style={{ borderRadius: '6px 0 0 6px' }}
                  >
                    <FaList size={12} />
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('map')}
                    title="Map view"
                    style={{ borderRadius: '0 6px 6px 0' }}
                  >
                    <FaMap size={12} />
                  </button>
                </div>
              </div>
            </div>

            {allRows.length === 0 ? (
              <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <Card.Body>
                  <div style={{ fontSize: '3rem' }}>🏠</div>
                  <h5 className="mt-3">No properties found</h5>
                  <p className="text-muted">Try adjusting your search filters.</p>
                </Card.Body>
              </Card>
            ) : viewMode === 'map' ? (
              <MapView results={allRows} onMarkerClick={r => navigate(`/rental/${r.id}`)} />
            ) : (
              <>
                <VirtualTable
                  columns={COLUMNS}
                  rows={allRows}
                  onRowClick={r => navigate(`/rental/${r.id}`)}
                  sortColumn={sortColumn}
                  sortDir={sortDir}
                  onSort={handleSort}
                  loading={false}
                />
                {/* Load more */}
                {hasMore && (
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-primary"
                      onClick={loadMoreRows}
                      disabled={loadingMore}
                      style={{ borderRadius: 20, paddingInline: 32 }}
                      className="btn1"
                    >
                      {loadingMore
                        ? <><Spinner size="sm" animation="border" className="me-2" />Loading more...</>
                        : `Load more (${total - allRows.length} remaining)`
                      }
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty state before first search */}
        {!loading && !searched && (
          <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <Card.Body>
              <FaSearch size={48} style={{ color: '#cbd5e1' }} />
              <h5 className="mt-3 text-muted">Use the filters above to search rentals</h5>
              <p className="text-muted small">Filter by state, property type, price, bedrooms and more.</p>
            </Card.Body>
          </Card>
        )}
      </Container>

      <style>{`
        .vt-row:hover td { background-color: #f0f7ff !important; }
        .vt-row:hover { background-color: #f0f7ff; }
        select, option { cursor: pointer; }
      `}</style>
    </div>
  );
}
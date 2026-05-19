import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/rentals';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaCalendarAlt, FaMapMarkerAlt, FaSave } from 'react-icons/fa';

// Decode email from JWT payload without a library
function getEmailFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email ?? payload.sub ?? null;
    } catch {
        return null;
    }
}

export default function Profile() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [address, setAddress] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        const userEmail = getEmailFromToken(token);
        if (!userEmail) { logout(); navigate('/login'); return; }
        setEmail(userEmail);
        setLoading(true);

        getProfile(userEmail, token)
            .then(res => {
                const d = res.data;
                setFirstName(d.firstName ?? '');
                setLastName(d.lastName ?? '');
                setDob(d.dob ?? '');
                setAddress(d.address ?? '');
            })
            .catch(err => {
                console.error('Profile load error:', err);
                const status = err.response?.status;
                if (status === 401) { logout(); navigate('/login'); }
                else setError('Failed to load profile: ' + (err.response?.data?.message ?? err.message));
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!firstName || !lastName || !dob || !address) {
            return setError('All fields are required: first name, last name, date of birth and address.');
        }

        // Basic date format validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dob)) {
            return setError('Date of birth must be in YYYY-MM-DD format.');
        }

        setSaving(true);
        try {
            const res = await updateProfile(email, { firstName, lastName, dob, address }, token);
            const d = res.data;
            setFirstName(d.firstName ?? firstName);
            setLastName(d.lastName ?? lastName);
            setDob(d.dob ?? dob);
            setAddress(d.address ?? address);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Failed to update profile.';
            const status = err.response?.status;
            if (status === 401) { logout(); navigate('/login'); }
            else setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    );

    return (
        <div
            style={{ fontFamily: 'var(--mons)', minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
            className="d-flex align-items-start pt-5"
        >
            <Container style={{ maxWidth: 700 }}>
                <Card className="border-0 shadow-lg" style={{ borderRadius: 16 }}>
                    <Card.Body className="p-5">
                        {/* Header */}
                        <div className="text-center mb-5">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                style={{ width: 64, height: 64, background: '#eff6ff', border: '2px solid #bfdbfe' }}
                            >
                                <FaUser size={28} className="text-primary" />
                            </div>
                            <h2 className="fw-bold text-dark mb-1">My Profile</h2>
                            <p className="text-muted small mb-0 d-flex align-items-center justify-content-center gap-1">
                                <FaEnvelope size={12} />{email}
                            </p>
                        </div>

                        {error && <Alert variant="danger" className="py-2 small rounded-3">{error}</Alert>}
                        {success && <Alert variant="success" className="py-2 small rounded-3">{success}</Alert>}

                        <Form onSubmit={handleSave}>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-start d-block">
                                            <FaUser size={11} className="me-1 text-muted" />First Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. Michael"
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-start d-block">
                                            <FaUser size={11} className="me-1 text-muted" />Last Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. Jordan"
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold small text-start d-block">
                                    <FaCalendarAlt size={11} className="me-1 text-muted" />Date of Birth
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    style={{ borderRadius: 8 }}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Format: YYYY-MM-DD
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold small text-start d-block">
                                    <FaMapMarkerAlt size={11} className="me-1 text-muted" />Address
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. 123 Fake Street, Springfield"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    style={{ borderRadius: 8 }}
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="primary"
                                className="btn1 w-100 fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
                                style={{ borderRadius: 8 }}
                                disabled={saving}
                            >
                                {saving
                                    ? <Spinner size="sm" animation="border" />
                                    : <><FaSave size={14} />Save Profile</>
                                }
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}
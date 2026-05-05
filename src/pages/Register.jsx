import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister, login as apiLogin } from '../api/rentals';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) return setError('Email is required.');
    if (!password) return setError('Password is required.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await apiRegister(email, password);
      // Auto-login after registration
      const res = await apiLogin(email, password);
      const token = res.data?.token ?? res.data?.bearerToken?.token ?? res.data?.access_token;
      if (token) {
        login(token);
        navigate('/');
      } else {
        setSuccess('Account created! Please log in.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (e) {
      const msg = e.response?.data?.message ?? e.response?.data?.error ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-aos="fade-up"
      className="d-flex align-items-center justify-content-center"
      style={{ fontFamily: 'var(--mons)', minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)' }}
    >
      <Container style={{ maxWidth: 700 }}>
        <Card className="border-0 shadow-lg">
          <Card.Body className="p-5">
            <div className="text-center mb-5">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 32, height: 32 }}>
                <FaUserPlus size={20} className="text-success" />
              </div>
              <h2 className="fw-bold text-dark">Create Account</h2>

            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            {success && <Alert variant="success" className="py-2 small">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small  text-start d-block">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaEnvelope className="text-muted" size={14} />
                  </span>
                  <Form.Control
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="border-start-0"
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-start d-block">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaLock className="text-muted" size={14} />
                  </span>
                  <Form.Control
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="border-start-0"
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small text-start d-block">Confirm Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaLock className="text-muted" size={14} />
                  </span>
                  <Form.Control
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="border-start-0"
                    required
                  />
                </div>
              </Form.Group>

              <Button type="submit" variant="success" className="btn1 w-100 fw-semibold py-2" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Create Account'}
              </Button>
            </Form>

            <hr className="my-4" />
            <p className="text-center text-muted small mb-0">
              Already have an account?{' '}
              <Link to="/login" className="fw-semibold text-primary text-decoration-none">
                Sign in here
              </Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
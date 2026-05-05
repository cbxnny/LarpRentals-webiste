import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api/rentals';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Email is required.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const token = res.data?.token ?? res.data?.bearerToken?.token ?? res.data?.access_token;
      if (!token) throw new Error('No token received');
      login(token);
      navigate('/');
    } catch (e) {
      const msg = e.response?.data?.message ?? e.response?.data?.error ?? 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-aos="fade-up"
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <Container style={{ maxWidth: 700 }}>
        <Card className="border-0 shadow-lg">

          <Card.Body className="p-5">
            <div className="text-center mb-5 ">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 32, height: 32 }}>
                <FaSignInAlt size={23} className="text-primary" />
              </div>
              <h2 className="fw-bold text-dark ">Login</h2>

            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-5">
                <Form.Label style={{ fontFamily: 'var(--mons)' }} className="fw-semibold small text-start d-block">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 ">
                    <FaEnvelope className="text-muted" size={14} />
                  </span>
                  <Form.Control
                    style={{ fontFamily: 'var(--mons)' }}
                    type="email"

                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="border-start-0 "
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ fontFamily: 'var(--mons)' }} className="fw-semibold small text-start d-block">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaLock className="text-muted" size={14} />
                  </span>
                  <Form.Control
                    style={{ fontFamily: 'var(--mons)' }}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="border-start-0"
                    required
                  />
                </div>
              </Form.Group>

              <Button style={{ fontFamily: 'var(--mons)' }} type="submit" variant="primary" className="btn1 w-100 fw-semibold py-2" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Sign In'}
              </Button>
            </Form>

            <hr className="my-4" />
            <p className="text-center text-muted small mb-0">
              Don't have an account?{' '}
              <Link to="/register" style={{ fontFamily: 'var(--mons)' }} className="fw-semibold text-primary text-decoration-none">
                Sign up
              </Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div >
  );
}
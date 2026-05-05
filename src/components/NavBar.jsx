import { useState } from 'react';
import { Navbar, Nav, Container, Button, Modal } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

import { CgProfile } from "react-icons/cg";

export default function NavigationBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary">
          <img src="/pictures/LarpRentals.png" alt="House" style={{ width: '50px', height: '50px' }} />

        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto gap-2 ml-2">
            <Nav.Link as={NavLink} to="/">Home</Nav.Link>
            <Nav.Link as={NavLink} to="/about">About</Nav.Link>
            <Nav.Link as={NavLink} to="/search">Rental Search</Nav.Link>

            {token ? (
              <Nav.Link as={NavLink} to="/rated">Rated Rentals</Nav.Link>
            ) : (
              <Nav.Link onClick={handleShow} style={{ cursor: 'pointer' }}>Rated Rentals</Nav.Link>
            )}
          </Nav>

          <Nav>
            {token ? (
              <Button variant="outline-danger" onClick={handleLogout} className="btn1 font-family: var(--mons) ms-2">
                Logout
              </Button>
            ) : (
              <>

                <Nav.Link className='ml-5' as={NavLink} to="/login"><CgProfile size={'27px'}></CgProfile>

                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Pop-up Dialogue for Logged-out Users */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Authentication Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You must be logged in to view Rated Rentals. Would you like to login now?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            handleClose();
            navigate('/login');
          }}>
            Go to Login
          </Button>
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
}

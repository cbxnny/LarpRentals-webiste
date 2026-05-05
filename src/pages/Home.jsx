import { Container, Row, Col, Button, Card, } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaHouseUser } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init();


export default function Home() {
    const navigate = useNavigate();

    return (

        <div data-aos="fade-down" data-aos-duration="500" className="bg-light pb-5" style={{ minHeight: 'calc(100vh - 56px)' }}>
            {/* Hero Section */}
            <div

                className="text-white text-center d-flex align-items-center justify-content-center mb-5"
                style={{
                    minHeight: '95vh',
                    background: 'linear-gradient(rgba(0,30,60,0.7), rgba(0,30,60,0.7)), url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80") no-repeat center center/cover'
                }}
            >
                <Container >
                    <h1 className="display-3 fw-bold mb-4 text-white drop-shadow">Find Your Dream Home in Australia</h1>
                    <p className="lead mb-5 fs-4 text-light">Explore thousands of rental properties across every state and territory.</p>
                    <Button
                        style={{ fontFamily: 'var(--mons)' }}
                        variant="primary"
                        size="lg"
                        className="btn1 px-5 py-3 rounded-pill fw-bold shadow-lg"

                        onClick={() => navigate('/search')}
                    >
                        Start Your Search
                    </Button>
                </Container>
            </div>

            {/* Features Section */}
            <Container data-aos="fade-up" data-aos-duration="1000" className="pt-4 mb-5">
                <div className="text-center mb-5">
                    <h2 className="fw-bold fs-1 text-dark">Why Choose LarpRentals?</h2>
                    <p className="text-muted fs-5">Everything you need to find the perfect place.</p>
                </div>

                <Row className="g-4">
                    <Col md={4}>
                        <Card onClick={() => navigate('/about')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{ borderRadius: '15px' }}>
                            <Card.Body>
                                <div className="mb-4 mt-2">
                                    <span style={{ fontSize: '3rem' }}>
                                        <FaHouseUser size={"50px"} />
                                    </span>
                                </div>
                                <Card.Title className="fw-bold fs-4 mb-3">Extensive Listings</Card.Title>
                                <Card.Text className="text-muted fs-6">
                                    Access the most comprehensive database of rental properties updated for the current market conditions.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card onClick={() => navigate('/search')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{ borderRadius: '15px' }}>
                            <Card.Body>
                                <div className="mb-4 mt-2">
                                    <span style={{ fontSize: '3rem' }}>
                                        <FaSearch size={"50px"} />
                                    </span>
                                </div>
                                <Card.Title className="fw-bold fs-4 mb-3">Advanced Search</Card.Title>
                                <Card.Text className="text-muted fs-6">
                                    Filter by state, property type, price, and more to easily find exactly what you're looking for.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card onClick={() => navigate('/rated')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{ borderRadius: '15px' }}>
                            <Card.Body>
                                <div className="mb-4 mt-2">
                                    <span style={{ fontSize: '3rem' }}>
                                        <FaStar size={"50px"} />
                                    </span>
                                </div>
                                <Card.Title className="fw-bold fs-4 mb-3">Community Ratings</Card.Title>
                                <Card.Text className="text-muted fs-6">
                                    Log in to interact with our community, leave ratings on properties, and view your history.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';


export default function About() {
    const navigate = useNavigate();

    return (
        <div data-aos="fade-down" data-aos-duration="500" className="bg-light pb-5" style={{ minHeight: 'calc(100vh - 56px)' }}>
            {/* Hero Section */}
            <div
                className="text-white text-center d-flex align-items-center justify-content-center mb-5"
                style={{
                    minHeight: '95vh',
                    background: 'url("/pictures/breaking-bad-house-0-scaled.webp") no-repeat center center/cover'
                }}
            >
                <Container>
                    <h1 className="display-3 fw-bold mb-4 text-white  drop-shadow" style={{ textShadow: '5px 5px 5px rgba(0, 0, 0, 0.5)' }}>About Us</h1>

                </Container>
            </div>

            {/* Features Section */}
            <Container data-aos="fade-up" data-aos-anchor-placement="top-bottom" data-aos-duration="1000" className="pt-4 mb-5">
                <div className="text-center mb-5">
                    <h2 className="fw-bold fs-1 text-dark mb-4">Our Goal</h2>
                    <p className="text-muted fs-5 mb-4">Welcome to LARP Rentals, where we redefine the short-term stay experience across Australia. </p>
                    <p className="text-muted fs-5 mb-4">Founded on the principle that a rental should be more than just a place to sleep, we specialize in high-quality properties that serve as the ultimate backdrop for your next chapter whether that’s a professional retreat or a weekend of pure escapism.</p>
                    <p className="text-muted fs-5 mb-4">Our team knows that the best stories are the ones you live out loud. We draw inspiration from those "larger than life" moments like LARPing in a Ferrari through the neon-soaked streets of Miami and bring that same energy and premium standard to the Australian rental market.</p>
                    <p className="text-muted fs-5 mb-4">At LARP Rentals, we don’t just provide a roof; we provide the stage for your next great adventure. From sleek urban apartments to coastal escapes, we ensure every stay is lived at full throttle.</p>
                </div>

                <Row className="g-4">
                    <Col md={4}>
                        <Card onClick={() => navigate('/search')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{
                            borderRadius: '15px', background: 'url("/pictures/The-Great-Expectation-LR.jpg") no-repeat center center/cover',

                        }}>
                            <Card.Body>

                                <Card.Title className="text-white fw-bold fs-4 mb-8" style={{ textShadow: '4px 4px 4px rgba(0, 0, 0, 0.5)' }}>Logan Central</Card.Title>

                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card onClick={() => navigate('/search')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{ borderRadius: '15px', background: 'url("/pictures/hq720.jpg") no-repeat center center/cover' }}>
                            <Card.Body>


                                <Card.Title className="text-white fw-bold fs-4 mb-5" style={{ textShadow: '4px 4px 4px rgba(0, 0, 0, 0.5)' }}>Woodridge</Card.Title>

                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card onClick={() => navigate('/search')} className="card1 h-100 border-0 shadow-sm text-center p-4 d-flex flex-column" style={{ borderRadius: '15px', background: 'url("/pictures/a9b24651d7ed6632b7ad71fd02908de5.jpg") no-repeat center center/cover' }}>
                            <Card.Body>

                                <Card.Title className="text-white fw-bold fs-4 mb-8" style={{ textShadow: '3px 3px 4px rgba(0, 0, 0, 0.5)' }}>Inala</Card.Title>
                                <Card.Text className="text-muted fs-5 ">

                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="mb-5 p-4"></div>


                {/* Acknowledgement of Country */}
                <div className="text-center p-4 " style={{ background: '#f8f5f0', borderRadius: 12, border: '1px solid #e8ddd0' }}>
                    <p className="text-muted fst-italic mb-0" style={{ fontSize: '0.9rem' }}>
                        LARP Rentals acknowledges the Traditional Custodians of the lands on which our properties are located and pays respect to Elders past, present, and emerging. We recognise the continuing connection of Aboriginal and Torres Strait Islander peoples to land, water, and community.
                    </p>
                </div>
            </Container>
        </div >
    );
}
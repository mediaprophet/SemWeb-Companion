import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { FaBookmark, FaDatabase, FaComments, FaTags, FaCog, FaInfoCircle, FaTools } from "react-icons/fa";

export default function AppLayout({ children, onNav, activeKey }) {
  return (
    <Container fluid style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Row>
        <Col xs={2} style={{ background: "#343a40", color: "#fff", minHeight: "100vh", padding: 0 }}>
          <div className="p-3 fw-bold fs-5" style={{ borderBottom: "1px solid #444" }}>
            SemWeb Companion
          </div>
          <Nav variant="pills" className="flex-column" activeKey={activeKey} onSelect={onNav}>
            <Nav.Link eventKey="bookmarks" className="d-flex align-items-center gap-2 text-white">
              <FaBookmark /> Bookmarks
            </Nav.Link>
            <Nav.Link eventKey="structured" className="d-flex align-items-center gap-2 text-white">
              <FaDatabase /> Structured Data
            </Nav.Link>
            <Nav.Link eventKey="chat" className="d-flex align-items-center gap-2 text-white">
              <FaComments /> Chat
            </Nav.Link>
            <Nav.Link eventKey="utils" className="d-flex align-items-center gap-2 text-white">
              <FaTools /> Utils
            </Nav.Link>
            <Nav.Link eventKey="annotations" className="d-flex align-items-center gap-2 text-white">
              <FaTags /> Annotations
            </Nav.Link>
            <Nav.Link eventKey="settings" className="d-flex align-items-center gap-2 text-white">
              <FaCog /> Settings
            </Nav.Link>
            <Nav.Link eventKey="about" className="d-flex align-items-center gap-2 text-white">
              <FaInfoCircle /> About
            </Nav.Link>
          </Nav>
        </Col>
        <Col xs={10} style={{ padding: 0 }}>
          <div style={{ minHeight: "100vh", padding: 24 }}>{children}</div>
        </Col>
      </Row>
    </Container>
  );
}

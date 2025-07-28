
import React from "react";
import { Container, Row, Col, Nav, Accordion } from "react-bootstrap";
import { FaBookmark, FaDatabase, FaComments, FaTags, FaCog, FaInfoCircle, FaTools, FaFolderOpen } from "react-icons/fa";
import "./sidebar-dark.css";

export default function AppLayout({ children, onNav, activeKey, breadcrumbSub }) {
  // Breadcrumb labels for each tab
  const breadcrumbLabels = {
    directory: 'Directory',
    structured: 'Structured Data',
    chat: 'Chat',
    utils: 'Utils',
    annotations: 'Annotations',
    settings: 'Settings',
    about: 'About',
  };
  return (
    <Container fluid style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Row>
        <Col xs={2} className="sidebar-dark" style={{ background: "#343a40", color: "#fff", minHeight: "100vh", padding: 0 }}>
          <div className="p-3 fw-bold fs-5" style={{ borderBottom: "1px solid #444" }}>
            SemWeb Companion
          </div>
          <Nav variant="pills" className="flex-column" activeKey={activeKey} onSelect={onNav}>
            <Accordion defaultActiveKey="0" alwaysOpen flush style={{ background: 'transparent' }}>
              <Accordion.Item eventKey="0">
                <Accordion.Header style={{ background: 'transparent' }}>
                  <FaFolderOpen className="me-2" /> Apps
                </Accordion.Header>
                <Accordion.Body style={{ padding: 0, background: 'transparent' }}>
                  <Nav.Link eventKey="directory" className="d-flex align-items-center gap-2 ps-4">
                    <FaDatabase /> Directory
                  </Nav.Link>
                  <Nav.Link eventKey="structured" className="d-flex align-items-center gap-2 ps-4">
                    <FaDatabase /> Structured Data
                  </Nav.Link>
                  <Nav.Link eventKey="chat" className="d-flex align-items-center gap-2 ps-4">
                    <FaComments /> Chat
                  </Nav.Link>
                  <Nav.Link eventKey="annotations" className="d-flex align-items-center gap-2 ps-4">
                    <FaTags /> Annotations
                  </Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
            <Nav.Link eventKey="utils" className="d-flex align-items-center gap-2 ps-4">
              <FaTools /> Utils
            </Nav.Link>
            <Nav.Link eventKey="settings" className="d-flex align-items-center gap-2 ps-4">
              <FaCog /> Settings
            </Nav.Link>
            <Nav.Link eventKey="about" className="d-flex align-items-center gap-2 ps-4">
              <FaInfoCircle /> About
            </Nav.Link>
          </Nav>
        </Col>
        <Col xs={10} style={{ padding: 0 }}>
          <div style={{ minHeight: "100vh", padding: 24 }}>
            {/* Breadcrumbs */}
            <nav aria-label="breadcrumb" style={{ marginBottom: 16 }}>
              <ol className="breadcrumb" style={{ background: 'none', padding: 0, margin: 0 }}>
                <li className="breadcrumb-item active" aria-current="page" style={{ fontWeight: 500, fontSize: '1.1em' }}>
                  {'>'} {breadcrumbLabels[activeKey] || ''}
                  {breadcrumbSub ? <span> / {breadcrumbSub}</span> : null}
                </li>
              </ol>
            </nav>
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

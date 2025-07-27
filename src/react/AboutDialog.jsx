
import { FaGithub, FaBook, FaBug, FaGavel, FaUsers, FaExternalLinkAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';

function renderRDFJSON(data, t) {
  if (!data) return null;
  return (
    <section typeof="schema:SoftwareApplication foaf:Project" resource={data['@id']} vocab="http://schema.org/">
      <div className="d-flex align-items-center mb-3">
        <img alt={t('osdsIconAlt', 'OpenLink Structured Data Sniffer icon')} src="../images/icon48.png" style={{ width: 48, height: 48, marginRight: 16 }} />
        <div>
          <h2 property="schema:name" className="mb-0">{data['schema:name']}</h2>
          <span className="badge bg-info text-dark ms-2" property="schema:softwareVersion">v{data['schema:softwareVersion']}</span>
        </div>
      </div>
      <p property="schema:description" className="lead">{data['schema:description']}</p>
      <section className="mb-3">
        <h4>{t('features', 'Features')}</h4>
        <ul>
          {data['schema:featureList'] && data['schema:featureList'].map((f, i) => (
            <li key={i} property="schema:featureList">{f}</li>
          ))}
        </ul>
      </section>
      <section className="mb-3">
        <h4>{t('links', 'Links')}</h4>
        <ul>
          <li>
            <FaGithub />{' '}
            <a href={data['schema:url']} property="schema:url" target="_blank" rel="noopener noreferrer">{t('projectHomepage', 'Project Homepage')} <FaExternalLinkAlt style={{ fontSize: 12 }}/></a>
          </li>
          <li>
            <FaBook />{' '}
            <a href="https://github.com/OpenLinkSoftware/OSDS_extension#readme" target="_blank" rel="noopener noreferrer">{t('documentation', 'Documentation')} <FaExternalLinkAlt style={{ fontSize: 12 }}/></a>
          </li>
          <li>
            <FaBug />{' '}
            <a href="https://github.com/OpenLinkSoftware/OSDS_extension/issues" target="_blank" rel="noopener noreferrer">{t('reportIssues', 'Report Issues')} <FaExternalLinkAlt style={{ fontSize: 12 }}/></a>
          </li>
        </ul>
      </section>
      <section className="mb-3">
        <h4>{t('metadata', 'Metadata')}</h4>
        <dl>
          <dt>{t('version', 'Version')}</dt>
          <dd property="schema:softwareVersion">{data['schema:softwareVersion']}</dd>
          <dt>{t('lastUpdated', 'Last updated')}</dt>
          <dd property="schema:dateModified">{data['schema:dateModified']}</dd>
          <dt>{t('license', 'License')}</dt>
          <dd>
            <FaGavel />{' '}
            <a href={data['schema:license'] && data['schema:license']['@id']} property="schema:license" rel="license noopener noreferrer" target="_blank">{data['schema:license'] && data['schema:license']['schema:name']} <FaExternalLinkAlt style={{ fontSize: 12 }}/></a>
          </dd>
          <dt>{t('author', 'Author')}</dt>
          <dd>
            <FaUsers />{' '}
            <a href={data['dc:creator'] && data['dc:creator']['@id']} property="dc:creator" rel="creator noopener noreferrer" target="_blank"><span property="foaf:name">{data['dc:creator'] && data['dc:creator']['foaf:name']}</span> <FaExternalLinkAlt style={{ fontSize: 12 }}/></a>
          </dd>
        </dl>
      </section>
    </section>
  );
}

export default function AboutDialog({ show, onClose }) {
  const { t } = useTranslation();
  const [about, setAbout] = useState(null);
  useEffect(() => {
    fetch('about.rdf.json')
      .then(r => r.json())
      .then(setAbout)
      .catch(() => setAbout(null));
  }, []);
  if (!show) return null;
  return (
    <div className="modal show" tabIndex="-1" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} role="dialog" aria-modal="true" aria-labelledby="about-title">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title" id="about-title">{t('about', 'About')}</h3>
            <button type="button" className="btn-close" aria-label={t('close', 'Close')} onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {about ? renderRDFJSON(about, t) : <p>{t('loading', 'Loading...')}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('close', 'Close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

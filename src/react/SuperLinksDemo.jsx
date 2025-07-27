import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SuperLinksPopup from './SuperLinksPopup.jsx';
import SuperLinksHighlighter from './SuperLinksHighlighter.jsx';

// Demo data for SuperLinks results
const demoLinks = [
  { term: 'RDF', type: 'Concept', association: 'related' },
  { term: 'JSON-LD', type: 'Format', association: 'exact' },
  { term: 'Turtle', type: 'Format', association: 'related' },
];

export default function SuperLinksDemo() {
  const { t } = useTranslation();
  const [show, setShow] = useState(true);
  const [highlightTerm, setHighlightTerm] = useState(null);
  const [highlightEnabled, setHighlightEnabled] = useState(false);

  const handleHighlight = (term) => {
    setHighlightTerm(term);
    setHighlightEnabled(false); // Reset first to trigger effect
    setTimeout(() => setHighlightEnabled(true), 10);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShow(true)}>{t('showSuperLinksPopup', 'Show SuperLinks Popup')}</button>
      <SuperLinksPopup
        show={show}
        onClose={() => setShow(false)}
        links={demoLinks}
        onHighlight={handleHighlight}
      />
      <SuperLinksHighlighter term={highlightTerm} enabled={highlightEnabled} />
    </>
  );
}

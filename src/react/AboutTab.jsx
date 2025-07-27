
import React from 'react';
import { useTranslation } from 'react-i18next';


export default function AboutTab() {
  const { t } = useTranslation();
  return (
    <div className="about-tab p-4" role="region" aria-labelledby="about-heading">
      <img alt="OpenLink Structured Data Sniffer icon" src="../images/icon48.png" style={{ width: 48, height: 48 }} />
      <h3 id="about-heading">{t('about')}</h3>
      <p id="ext_ver">{t('version')} 0.0.0</p>
      <p>
        {t('aboutDescription', 'Browser extension that reveals metadata oriented structured data embedded within HTML documents. In addition, this extension also includes loosely-coupled bindings to a variety of data access and lookup services across HTTP based networks such as the World Wide Web and Linked Open Data Cloud.')}
      </p>
      <p>
        {t('visitHomepage', 'Visit OpenLink Structured Data Sniffer homepage for additional product information.', {
          homepage: <a href="http://osds.openlinksw.com" target="_blank" rel="noopener noreferrer">homepage</a>
        })}
      </p>
      <p>
        {t('copyright', 'Copyright 2015-2021 OpenLink Software', {
          year: <span id="c_year">2021</span>,
          company: <a href="http://www.openlinksw.com" target="_blank" rel="noopener noreferrer">OpenLink Software</a>
        })}
      </p>
    </div>
  );
}

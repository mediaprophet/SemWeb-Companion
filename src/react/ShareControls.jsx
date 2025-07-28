import React from 'react';
import { FaRegCopy, FaTwitter, FaRegBookmark } from 'react-icons/fa';

export default function ShareControls({ t, handleShareCopy, handleShareTwitter, handleBookmark, shareToast }) {
  return (
    <div style={{display:'flex',gap:12,margin:'1em 0',alignItems:'center'}}>
      <button className="osds-animated-btn osds-icon-anim" title={t('copyLink', 'Copy Link')} aria-label={t('copyLink', 'Copy Link')} onClick={handleShareCopy}>
        <FaRegCopy aria-label="Copy" />
      </button>
      <button className="osds-animated-btn osds-icon-anim" title={t('shareOnTwitter', 'Share on Twitter')} aria-label={t('shareOnTwitter', 'Share on Twitter')} onClick={handleShareTwitter}>
        <FaTwitter aria-label="Twitter" />
      </button>
      <button className="osds-animated-btn osds-icon-anim" title={t('bookmark', 'Bookmark')} aria-label={t('bookmark', 'Bookmark')} onClick={handleBookmark}>
        <FaRegBookmark aria-label="Bookmark" />
      </button>
      {shareToast && <div className="osds-toast" aria-live="polite">{shareToast}</div>}
    </div>
  );
}

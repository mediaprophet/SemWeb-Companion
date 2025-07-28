import Directory from './directory/Directory.jsx';
import DataView from './data-view/DataView.jsx';
import SuperLinksTab from './SuperLinksTab.jsx';
import SuperLinksDemo from './SuperLinksDemo.jsx';
import SolidChatSidebar from './SolidChatSidebar.jsx';
import React, { useState } from 'react';
import { useSolidAuth } from './solid/SolidAuthProvider.jsx';

export default function Apps({ activeKey, setBreadcrumbSub }) {
  const { isLoggedIn } = useSolidAuth();
  if (activeKey === 'chat') {
    return (
      <div>
        {isLoggedIn ? (
          <SolidChatSidebar />
        ) : (
          <div className="alert alert-info mt-4" style={{ maxWidth: 400 }}>
            Please log in to your socially-aware Cloud Storage provider to use chat.
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      {activeKey === 'directory' && <Directory setBreadcrumbSub={setBreadcrumbSub} />}
      {activeKey === 'structured' && <DataView />}
      {activeKey === 'annotations' && <SuperLinksDemo />}
    </>
  );
}

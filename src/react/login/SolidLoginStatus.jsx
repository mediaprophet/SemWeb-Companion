import React from "react";
import { useSolidAuth } from "../solid/SolidAuthProvider";
import { useTranslation } from 'react-i18next';

export default function SolidLoginStatus() {
  const { t } = useTranslation();
  const { webId, isLoggedIn } = useSolidAuth();

  let status = t('notLoggedIn', 'Not logged in');
  if (isLoggedIn && webId) {
    status = t('loggedInSolidPod', 'Logged into Solid Pod:') + ' ' + webId;
  } else if (isLoggedIn) {
    status = t('loggedInBrowser', 'Logged into browser');
  }

  return (
    <div style={{ margin: '1em 0', color: isLoggedIn ? 'green' : 'gray' }}>
      <b>{t('loginStatus', 'Login Status')}:</b> {status}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch as solidFetch
} from "@inrupt/solid-client-authn-browser";
export default SolidAuthProvider;

const SolidAuthContext = createContext();

export function SolidAuthProvider({ children }) {
  const [webId, setWebId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [storage, setStorage] = useState(null);

  // Restore session on mount
  useEffect(() => {
    handleIncomingRedirect({ restorePreviousSession: true }).then(() => {
      const session = getDefaultSession();
      if (session.info.isLoggedIn) {
        setWebId(session.info.webId);
        setIsLoggedIn(true);
        // Optionally fetch profile here
      }
    });
  }, []);

  const solidLogin = useCallback(async (oidcIssuer) => {
    await login({
      oidcIssuer,
      redirectUrl: window.location.href,
      clientName: "Structured Data Sniffer"
    });
  }, []);

  const solidLogout = useCallback(async () => {
    await logout();
    setWebId(null);
    setIsLoggedIn(false);
    setProfile(null);
    setStorage(null);
  }, []);

  const checkSession = useCallback(() => {
    const session = getDefaultSession();
    if (session.info.isLoggedIn) {
      setWebId(session.info.webId);
      setIsLoggedIn(true);
      return session.info.webId;
    }
    setWebId(null);
    setIsLoggedIn(false);
    return null;
  }, []);

  // Example: fetch profile document (Turtle or JSON-LD)
  const fetchProfile = useCallback(async (webIdUrl) => {
    try {
      const response = await solidFetch(webIdUrl, {
        headers: { Accept: "text/turtle,application/ld+json,text/html" }
      });
      if (response.ok) {
        const text = await response.text();
        // Optionally parse RDF here
        setProfile(text);
        return text;
      }
    } catch (e) {
      // handle error
    }
    return null;
  }, []);

  // Example: PUT resource to Solid pod
  const putResource = useCallback(async (url, data, contentType) => {
    try {
      const response = await solidFetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: data
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }, []);

  return (
    <SolidAuthContext.Provider
      value={{
        webId,
        isLoggedIn,
        profile,
        storage,
        solidLogin,
        solidLogout,
        checkSession,
        fetchProfile,
        putResource
      }}
    >
  export default SolidAuthProvider;
      {children}
    </SolidAuthContext.Provider>
  );
}

export function useSolidAuth() {
  return useContext(SolidAuthContext);
}

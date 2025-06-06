import React, { ReactNode, useEffect, useState } from "react";
import { auth } from "../firebase/indexFirebase.js";

export default function AuthGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading)
    return (
      fallback || (
        <div style={{ textAlign: "center", marginTop: 64 }}>Loading...</div>
      )
    );
  if (!user)
    return (
      <div style={{ textAlign: "center", marginTop: 64 }}>
        Please sign in to continue.
      </div>
    );
  return children;
}

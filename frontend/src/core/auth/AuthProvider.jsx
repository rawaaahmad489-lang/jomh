//اوث بروفايدار
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import { AuthContext } from "../context/AuthContext";

async function fetchWithRetry(authId, maxRetries = 4) {
  const delays = [500, 1000, 2000, 3000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await new Promise(r => setTimeout(r, delays[attempt]));
        continue;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role, status")
        .eq("auth_id", authId)
        .maybeSingle();

      if (error) {
        console.warn(`Attempt ${attempt + 1}:`, error.message);
        await new Promise(r => setTimeout(r, delays[attempt]));
        continue;
      }

      if (data) return data;

      console.log(`Attempt ${attempt + 1}: row not ready yet`);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }

    } catch (e) {
      console.warn(`Attempt ${attempt + 1} crash:`, e.message);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  }
  return null;
}

export default function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);
  const [status,  setStatus]  = useState(null);
  const [isReady, setIsReady] = useState(false);

  const isMounted   = useRef(true);
  const initDone    = useRef(false); // ← يمنع onAuthStateChange من التدخل قبل init

  const applyUserData = useCallback((data) => {


    if (!isMounted.current) return;
    setRole(data?.role   ?? null);
    setStatus(data?.status ?? null);
  }, []);
// في AuthProvider — بدّل applyUserData وفي finally
const applyAndFinish = useCallback((data) => {
  if (!isMounted.current) return;
  // ← حدّث كل شيء دفعة واحدة قبل isReady
  setRole(data?.role     ?? null);
  setStatus(data?.status ?? null);
  setIsReady(true); // ← هنا وليس في finally منفصل
}, []);
  const clearSession = useCallback(() => {
    if (!isMounted.current) return;
    setUser(null);
    setRole(null);
    setStatus(null);
    //setIsReady(true);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    initDone.current  = false;
// داخل useEffect في AuthProvider

const init = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    // ... منطق التحقق الخاص بك ...
      if (error || !session?.access_token) {
      await supabase.auth.signOut();
      if (isMounted.current) {
        setUser(null);
        setRole(null);
        setStatus(null);
        setIsReady(true); // ← مع بعض
      }
      return;
    }

    const currentUser = session.user;
    if (isMounted.current) setUser(currentUser);
    if (currentUser) {
      const data = await fetchWithRetry(currentUser.id);
      applyAndFinish(data);
    } else {
      applyAndFinish(null);
    }
  } catch (e) {
     console.error("Auth init error:", e);
    applyAndFinish(null);
  } finally {
    // 🚩 هذا السطر هو المفتاح!
    initDone.current = true; 
  }
};
    

    init();

   const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ← انتظر حتى تنتهي init أولاً
        if (!initDone.current) return;
        if (!isMounted.current) return;

        console.log("AUTH EVENT:", event);

        const currentUser = session?.user ?? null;

        if (!currentUser) {
          clearSession();
          return;
        }
if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
  if (isMounted.current) {
    setUser(currentUser);
   
  }
  try {
    const data = await fetchWithRetry(currentUser.id);
    applyAndFinish(data); // ← role وstatus وisReady معاً
  } catch (e) {
    console.error("Auth init error:", e);
    applyAndFinish(null);
  }
}

        
      }
    );
/*
if (event === "TOKEN_REFRESHED") {
  // فقط حدّث المستخدم بصمت، لا تلمس isReady
  if (isMounted.current) setUser(currentUser);
  return;
}

if (event === "SIGNED_IN") {
  if (isMounted.current) {
    setUser(currentUser);
    setIsReady(false); // فقط عند تسجيل دخول جديد فعلي
  }
  try {
    const data = await fetchWithRetry(currentUser.id);
    applyAndFinish(data);
  } catch (e) {
    applyAndFinish(null);
  }
} */
    return () => {
      isMounted.current = false;
      listener.subscription.unsubscribe();
    };
  }, [applyUserData, clearSession,applyAndFinish]);

  return (
    <AuthContext.Provider value={{ user, role, status, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}
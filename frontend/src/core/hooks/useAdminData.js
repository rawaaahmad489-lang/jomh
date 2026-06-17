// src/core/hooks/useAdminData.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

// ─── STATS ───────────────────────────────────────────────────────────────────
export function useAdminStats() {
  const [stats, setStats] = useState({
    mothers: 0, doctors: 0, vendors: 0,
    articles: 0, pendingArticles: 0,
    reports: 0, stores: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [
      { count: mothers },
      { count: doctors },
      { count: vendors },
      { count: articles },
      { count: pendingArticles },
      { count: stores },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "mother"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "doctor"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "vendor"),
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("stores").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      mothers:         mothers         || 0,
      doctors:         doctors         || 0,
      vendors:         vendors         || 0,
      articles:        articles        || 0,
      pendingArticles: pendingArticles || 0,
      reports:         0,
      stores:          stores          || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, loading, refetch: fetchStats };
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export function useAdminUsers(role, page = 1, pageSize = 10) {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    const { data, count } = await supabase
      .from("users")
      .select("user_id, name, email, role, status, avatar_url, created_at", { count: "exact" })
      .eq("role", role)
      .order("created_at", { ascending: false })
      .range(from, to);

    setUsers(data  || []);
    setTotal(count || 0);
    setLoading(false);
  }, [role, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  return { users, total, loading, refetch: fetchUsers };
}

// ─── ARTICLES ─────────────────────────────────────────────────────────────────
// في useAdminData.js — استبدل useAdminArticles بهذا
export function useAdminArticles(status = "all", page = 1) {
  const [articles, setArticles] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const pageSize = 10;

  const fetchArticles = useCallback(async () => {
    setLoading(true);

    // جلب الكل أولاً بدون join معقد
    let query = supabase
      .from("articles")
      .select(
        "article_id, title, status, created_at, reading_time_minutes, views_count, cover_image_url, doctor_id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status !== "all") query = query.eq("status", status);

    const { data, count, error } = await query;

    if (error) {
      console.error("Articles fetch error:", error);
      setArticles([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // جلب أسماء الأطباء منفصلاً
    if (data && data.length > 0) {
      const doctorIds = [...new Set(data.map(a => a.doctor_id).filter(Boolean))];
      
      const { data: doctors } = await supabase
        .from("users")
        .select("user_id, name")
        .in("user_id", doctorIds);

      const doctorMap = {};
      (doctors || []).forEach(d => { doctorMap[d.user_id] = d.name; });

      const enriched = data.map(a => ({
        ...a,
        doctor_name: doctorMap[a.doctor_id] || "—",
      }));

      setArticles(enriched);
    } else {
      setArticles(data || []);
    }

    setTotal(count || 0);
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  return { articles, total, loading, refetch: fetchArticles };
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export function useAdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setReports(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  return { reports, loading, refetch: fetchReports };
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export function useAuditLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setLogs(
        (data || []).map((log) => ({
          id:     log.id || log.log_id,
          action: log.action || log.event || "—",
          email:  log.email  || log.user_email || "—",
          ip:     log.ip_address || "—",
          time:   log.created_at,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  return { logs, loading };
}
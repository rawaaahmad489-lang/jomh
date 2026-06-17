// src/hooks/useMotherData.js
// src/core/hooks/useMotherData.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

export const useMotherData = () => {
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState(null);
  const [motherProfile, setMotherProfile] = useState(null);
  const [children,      setChildren]      = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [todos,         setTodos]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  // New systems
  const [streak,        setStreak]        = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [habits,        setHabits]        = useState([]);
  const [habitLogs,     setHabitLogs]     = useState([]);
  const [moodLogs,      setMoodLogs]      = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }

      // Fetch user row
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();
      if (!userData) { setLoading(false); return; }
      setUser(userData);

      const uid = userData.user_id;

      // Parallel fetches
      const [
        { data: profile },
        { data: kids },
        { data: appts },
        { data: todoData },
        { data: notifs },
        { data: streakData },
        { data: pointsData },
        { data: habitsData },
        { data: habitLogsData },
        { data: moodData },
      ] = await Promise.all([
        supabase.from("mother_profiles").select("*").eq("mother_id", uid).single(),
        supabase.from("children")
          .select("*, child_growth(*), child_medical_events(*)")
          .eq("mother_id", uid)
          .order("birth_date", { ascending: false }),
 supabase.from("appointments")
  .select(`
    appointment_id,
    mother_id,
    doctor_id,
    child_id,
    appointment_date,
    type,
    status,
    notes,
    doctor_profiles (
      doctor_id,
      specialization,
      users!doctor_profiles_doctor_id_fkey (
        user_id,
        name,
        avatar_url
      )
    ),
    children (child_id, name)
  `)
  .eq("mother_id", uid)
  .order("appointment_date", { ascending: true }),
 
         
        supabase.from("todo_list")
          .select("*").eq("mother_id", uid)
          .order("created_at", { ascending: false }),
        supabase.from("notifications")
          .select("*").eq("user_id", uid)
          .order("created_at", { ascending: false }).limit(20),
          
        supabase.from("mother_activity_streaks").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("mother_points")
          .select("*").eq("mother_id", uid)
          .order("earned_at", { ascending: false }).limit(30),
        supabase.from("habit_definitions")
          .select("*").eq("mother_id", uid).eq("is_active", true)
          .order("created_at", { ascending: true }),
        supabase.from("habit_logs")
          .select("*").eq("mother_id", uid)
          .gte("completed_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]),
      supabase.from("mother_mood_logs")
  .select("*").eq("user_id", uid)
  .order("logged_date", { ascending: false }).limit(30),
      ]);

      setMotherProfile(profile);
      setChildren(kids   || []);
      setAppointments(appts || []);
      setTodos(todoData  || []);
      setNotifications(notifs || []);
      setUnreadCount((notifs || []).filter(n => !n.is_read).length);
      setStreak(streakData);
      setPointsHistory(pointsData || []);
      setHabits(habitsData || []);
      setHabitLogs(habitLogsData || []);
      setMoodLogs(moodData || []);
    } catch (err) {
      console.error("useMotherData error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Award points helper ──────────────────────────────────────────────
  const awardPoints = async (motherId, points, reason, relatedId = null) => {
    try {
      // Insert point log
      await supabase.from("mother_points").insert({
        mother_id: motherId, points, reason, related_id: relatedId
      });
      // Upsert streak
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("mother_activity_streaks").select("*").eq("mother_id", motherId).single();

      if (!existing) {
        await supabase.from("mother_activity_streaks").insert({
         user_id: motherId, current_streak: 1, longest_streak: 1,
          last_active_date: today, total_points: points, level: 1
        });
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = existing.last_active_date === today
          ? existing.current_streak
          : existing.last_active_date === yesterday
            ? existing.current_streak + 1
            : 1;
        const newTotal = existing.total_points + points;
        await supabase.from("mother_activity_streaks").update({
          current_streak:   newStreak,
          longest_streak:   Math.max(existing.longest_streak, newStreak),
          last_active_date: today,
          total_points:     newTotal,
          level:            Math.max(1, Math.floor(newTotal / 100) + 1),
          updated_at:       new Date().toISOString(),
        }).eq("user_id", motherId);
      }
      fetchAll(); // refresh
    } catch (err) { console.error("awardPoints error:", err); }
  };

  // ── Log mood ─────────────────────────────────────────────────────────
  /*
  const logMood = async (motherId, mood, note = "") => {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("mother_mood_logs")
      .upsert({ mother_id: motherId, mood, note, log_date: today },
               { onConflict: "mother_id,log_date" });
    if (!error) await awardPoints(motherId, 5, "mood_log");
  };*/

const logMood = async (motherId, mood, emoji = "", label = "") => {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("mother_mood_logs")
      .upsert({ user_id: motherId, mood, emoji, label, logged_date: today },
               { onConflict: "user_id,logged_date" });
    if (!error) await awardPoints(motherId, 5, "mood_log");
  };


  // ── Toggle habit ─────────────────────────────────────────────────────
  const toggleHabit = async (habitId, motherId) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = habitLogs.find(
      l => l.habit_id === habitId && l.completed_date === today
    );
    if (existing) {
      await supabase.from("habit_logs").delete()
        .eq("habit_id", habitId).eq("completed_date", today);
    } else {
      await supabase.from("habit_logs")
        .insert({ habit_id: habitId, mother_id: motherId, completed_date: today });
      await awardPoints(motherId, 10, "habit_done", habitId);
    }
    fetchAll();
  };

  // ── Add habit ────────────────────────────────────────────────────────
  const addHabit = async (motherId, title, icon = "✅", color = "#d68b9d") => {
    await supabase.from("habit_definitions")
      .insert({ mother_id: motherId, title, icon, color });
    fetchAll();
  };

  // ── Delete habit ─────────────────────────────────────────────────────
  const deleteHabit = async (habitId) => {
    await supabase.from("habit_definitions")
      .update({ is_active: false }).eq("habit_id", habitId);
    fetchAll();
  };

  return {
    loading, user, motherProfile, children, appointments,
    todos, notifications, unreadCount, refetch: fetchAll,
    // New
    streak,pointsHistory, habits, habitLogs, moodLogs,
    awardPoints, logMood, toggleHabit, addHabit, deleteHabit,
  };
};
 
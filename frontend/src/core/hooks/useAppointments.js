// src/hooks/useAppointments.js
import { useState, useEffect } from "react";
import { supabase } from "../../../services/supabaseClient";

export const useAppointments = (userId) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchDoctors = async () => {
  const { data } = await supabase
    .from("doctor_profiles")
    .select(`
      doctor_id,
      specialization,
      experience_years,
      bio,
      image,
      availability_schedule,
      users!doctor_profiles_doctor_id_fkey (
        name,
        avatar_url
      )
    `);
  setDoctors(data || []);
};
const fetchAppointments = async () => {
  if (!userId) return;
  const { data } = await supabase
    .from("appointments")
    .select(`
      *,
      doctor_profiles!appointments_doctor_id_fkey (
        specialization,
        image,
        users!doctor_profiles_doctor_id_fkey (name, avatar_url)
      ),
      children (name, birth_date)
    `)
    .eq("mother_id", userId)
    .order("appointment_date", { ascending: false });
  setAppointments(data || []);
};

  const bookAppointment = async ({ doctorId, childId, date, type, notes }) => {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        mother_id: userId,
        doctor_id: doctorId,
        child_id: childId || null,
        appointment_date: date,
        type,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();
    if (!error) await fetchAppointments();
    return { data, error };
  };

  const cancelAppointment = async (appointmentId) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("appointment_id", appointmentId);
    if (!error) await fetchAppointments();
    return { error };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDoctors(), fetchAppointments()]);
      setLoading(false);
    };
    if (userId) init();
  }, [userId]);

  return { appointments, doctors, loading, bookAppointment, cancelAppointment, refetch: fetchAppointments };
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

import AppointmentList from "@/components/AppointmentList";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { getAppointmentsWithPatientInfo } from "@/lib/actions/patient.action";

export default async function PatientAppointments({ params }: { params: { patientId?: string } }) {
  const patientId = params?.patientId;

  // Debug info
  const env = typeof window === "undefined" ? "server" : "client";
  console.log(`[PatientAppointments] Rendered on: ${env} | patientId:`, patientId);

  // Guard for missing patientId
  if (!patientId || patientId === "undefined" || patientId.trim() === "") {
    console.warn(`[PatientAppointments] ⚠️ Missing patientId (rendered on: ${env})`);
    return (
      <div className="p-6 text-center text-yellow-500">
        No patient ID found — please reload or select a valid patient.
      </div>
    );
  }

  // console.log(`[PatientAppointments] ✅ Fetching appointments for patientId: ${patientId}`);

  try {
    const [{ appointments, patientsMap }, doctors] = await Promise.all([
      getAppointmentsWithPatientInfo(patientId),
      getDoctors(),
    ]);

    return (
      <AppointmentList
        appointments={appointments}
        patients={patientsMap}
        doctors={doctors}
      />
    );
  } catch (err) {
    console.error(`[PatientAppointments] ❌ Failed to load appointments:`, err);
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load appointments. Please try again later.
      </div>
    );
  }
}

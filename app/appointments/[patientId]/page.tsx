import AppointmentList from "@/components/AppointmentList";
import { getAppointmentsWithPatientInfo } from "@/lib/actions/patient.action";

export default async function PatientAppointments({
  params: { patientId },
}: {
  params: { patientId: string };
}) {
  if (!patientId) {
    throw new Error("Patient ID is missing");
  }

  try {
    console.log("Fetching appointments for patientId in page:", patientId);
    const { appointments, patientsMap } = await getAppointmentsWithPatientInfo(patientId);
    console.log("Appointments in Page:", appointments);
    console.log("Patients Map in Page:", patientsMap);

    return <AppointmentList appointments={appointments} patients={patientsMap} />;
  } catch (error) {
    console.error("Failed to load appointments:", error);
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load appointments. Please try again later.
      </div>
    );
  }
}
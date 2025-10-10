import AppointmentList from "@/components/AppointmentList";
import { getDoctors } from "@/lib/actions/doctor.actions";
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
    
    // Fetch both appointments and doctors data
    const [{ appointments, patientsMap }, doctors] = await Promise.all([
      getAppointmentsWithPatientInfo(patientId),
      getDoctors()
    ]);
    
    // console.log("Appointments in Page:", appointments);
    // console.log("Patients Map in Page:", patientsMap);
    // console.log("Doctors in Page:", doctors); 
    return (
      <AppointmentList 
        appointments={appointments} 
        patients={patientsMap} 
        doctors={doctors} 
      />
    );
  } catch (error) {
    console.error("Failed to load appointments:", error);
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load appointments. Please try again later.
      </div>
    );
  }
}
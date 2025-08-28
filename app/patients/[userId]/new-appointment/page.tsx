import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { getPatient, getPatientAppointment } from "@/lib/actions/patient.action";
import Image from "next/image";

interface SearchParamProps {
  params: { userId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const Appointment = async ({ params: { userId }, searchParams }: SearchParamProps) => {
  let patient;

  // Use getPatientAppointment if navigating from success page (appointmentId present)
    patient = await getPatientAppointment(userId);
    if(patient == null) {
      patient = await getPatient(userId);
    }

  //console.log("Fetched patient:", patient); 

  // Redirect if patient is not found or patient.$id is undefined
  if (!patient || !patient.$id) {
    console.error(`Patient not found or invalid for userId: ${userId}`);
  }

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[860px] flex-1 justify-between">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="logo"
            className="mb-12 h-10 w-fit"
          />

          <AppointmentForm
            userId={userId}
            patientId={patient?.$id! || ""} 
            type="create"
            // appointment prop is optional, omit if not needed
          />

          <p className="copyright mt-10 py-12">© 2025 CarePulse</p>
        </div>
      </section>

      <Image
        src="/assets/images/appointment-img.png"
        height={1500}
        width={1500}
        alt="appointment"
        className="side-img max-w-[390px] bg-bottom"
      />
    </div>
  );
};

export default Appointment;
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { formatDateTime } from "@/lib/utils";
import { getAppointment } from "@/lib/actions/appointment.actions";
import { Appointment, Doctor } from "@/types/appwrite.types";

// Define the SearchParamProps type if not already defined
interface SearchParamProps {
  searchParams: { appointmentId?: string };
  params: { userId: string };
}

const RequestSuccess = async ({
  searchParams,
  params: { userId },
}: SearchParamProps) => {
  const appointmentId = (searchParams?.appointmentId as string) || "";
  const appointment = await getAppointment(appointmentId) as Appointment;

  if (!appointment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Appointment not found.</p>
      </div>
    );
  }

  // Fetch doctors dynamically
  const doctors = await getDoctors();
  const doctor = doctors.find(
    (doctor: Doctor) => doctor.name === appointment.primaryPhysician
  );

  return (
    <div className=" flex h-screen max-h-screen px-[5%]">
      <div className="success-img">
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="logo"
            className="h-10 w-fit"
          />
        </Link>

        <section className="flex flex-col items-center">
          <Image
            src="/assets/gifs/success.gif"
            height={300}
            width={280}
            alt="success"
          />
          <h2 className="header mb-6 max-w-[600px] text-center">
            Your <span className="text-green-500">appointment request</span> has
            been successfully submitted!
          </h2>
          <p>We&apos;ll be in touch shortly to confirm.</p>
        </section>

        <section className="request-details mt-6 space-y-3">
          <p className="font-medium">Requested appointment details:</p>
          <div className="flex items-center gap-3">
            {doctor?.imageUrl ? (
              <Image
                src={doctor.imageUrl}
                alt="doctor"
                width={60} 
                height={60}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                No Image
              </div>
            )}
            <p className="text-sm sm:text-base font-medium truncate">
              Dr. {doctor?.name || appointment.primaryPhysician || "Not specified"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Image
              src="/assets/icons/calendar.svg"
              height={20}
              width={20}
              alt="calendar"
              className="flex-shrink-0"
            />
            <p>{formatDateTime(appointment.schedule).dateTime}</p>
          </div>
        </section>


        <Button variant="outline" className="shad-primary-btn" asChild>
          <Link href={`/patients/${userId}/new-appointment`}>
            New Appointment
          </Link>
        </Button>

        <p className="copyright">© 2025 CarePulse</p>
      </div>
    </div>
  );
};

export default RequestSuccess;
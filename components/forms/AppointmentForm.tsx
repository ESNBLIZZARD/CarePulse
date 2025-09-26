"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query"; 
import { SelectItem } from "@/components/ui/select";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment, Doctor } from "@/types/appwrite.types";
import "react-datepicker/dist/react-datepicker.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";
import Link from "next/link";

export const AppointmentForm = ({
  userId,
  patientId,
  type = "create",
  appointment,
  setOpen,
}: {
  userId: string;
  patientId: string;
  type: "create" | "schedule" | "cancel";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient(); 
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment?.primaryPhysician || "",
      schedule: appointment ? new Date(appointment.schedule) : new Date(),
      reason: appointment?.reason || "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        const allDoctors = await getDoctors();
        setDoctors(allDoctors);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const onSubmit = async (values: z.infer<typeof AppointmentFormValidation>) => {
    setIsLoading(true);

    let status: "pending" | "scheduled" | "cancelled";
    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      default:
        status = "pending";
    }

    try {
      if (type === "create") {
        const newAppointment = await createAppointment({
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status,
          note: values.note,
          patientId: patientId,
        });

        if (newAppointment) {
          form.reset();

          queryClient.invalidateQueries({ queryKey: ["appointments"] });

          router.push(
            `/patients/${patientId}/new-appointment/success?appointmentId=${newAppointment.$id}`
          );
        }
      } else if (appointment) {
        const updatedAppointment = await updateAppointment({
          userId,
          appointmentId: appointment.$id,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            status,
            cancellationReason: values.cancellationReason,
          },
          type,
        });

        if (updatedAppointment) {
          setOpen?.(false);
          form.reset();

          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      }
    } catch (error) {
      console.error("Appointment form error:", error);
    }

    setIsLoading(false);
  };

  const buttonLabel =
    type === "cancel"
      ? "Cancel Appointment"
      : type === "schedule"
      ? "Schedule Appointment"
      : "Submit Appointment";

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-6"
        >
          {type === "create" && (
            <section className="mb-12 space-y-4">
              <h1 className="header">New Appointment</h1>
              <p className="text-dark-700">
                Request a new appointment in 10 seconds.
              </p>
            </section>
          )}

          {type !== "cancel" && (
            <>
              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="primaryPhysician"
                label="Doctor"
                placeholder="Select a doctor"
              >
                {isLoadingDoctors ? (
                  <SelectItem value="loading" disabled>
                    Loading doctors...
                  </SelectItem>
                ) : (
                  doctors.map((doctor, i) => (
                    <SelectItem
                      key={doctor.$id || doctor.name + i}
                      value={doctor.name}
                    >
                      <div className="flex cursor-pointer items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
                          {doctor.imageUrl ? (
                            <Image
                              src={doctor.imageUrl}
                              alt={doctor.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs" />
                          )}
                        </div>
                        <p className="text-sm">{doctor.name}</p>
                      </div>
                    </SelectItem>
                  ))
                )}
              </CustomFormField>

              <CustomFormField
                fieldType={FormFieldType.DATE_PICKER}
                control={form.control}
                name="schedule"
                label="Expected appointment date"
                showTimeSelect
                dateFormat="MM/dd/yyyy - h:mm aa"
              />

              <div
                className={`flex flex-col gap-6 ${
                  type === "create" && "xl:flex-row"
                }`}
              >
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="reason"
                  label="Appointment reason"
                  placeholder="Annual monthly check-up"
                  disabled={type === "schedule"}
                />

                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="note"
                  label="Comments/notes"
                  placeholder="Prefer afternoon appointments, if possible"
                  disabled={type === "schedule"}
                />
              </div>
            </>
          )}

          {type === "cancel" && (
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="cancellationReason"
              label="Reason for cancellation"
              placeholder="Urgent meeting came up"
            />
          )}

          <SubmitButton
            isLoading={isLoading}
            className={`${
              type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"
            } w-full`}
          >
            {buttonLabel}
          </SubmitButton>
        </form>
      </Form>

      {type === "create" && patientId && (
        <Link
          href={`/appointments/${patientId}`}
          className="text-xs hover:underline text-dark-700 mt-2 block"
        >
          My Appointments
        </Link>
      )}
    </>
  );
};

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateAppointment } from "@/lib/actions/appointment.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Appointment } from "@/types/appwrite.types";
import { AppointmentForm } from "./forms/AppointmentForm";
import "react-datepicker/dist/react-datepicker.css";

export const AppointmentModal = ({
  patientId,
  userId,
  appointment,
  type,
}: {
  patientId: string;
  userId: string;
  appointment?: Appointment;
  type: "schedule" | "cancel" | "complete";
  title?: string;
  description?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient(); 

  const handleCompleteConfirm = async () => {
    if (type !== "complete" || !appointment) return;
    setIsSubmitting(true);
    try {
      await updateAppointment({
        appointmentId: appointment.$id,
        userId,
        timeZone: "UTC", // Adjust as needed
        appointment: {
          ...appointment,
          status: "completed",
          cancellationReason: null,
        },
        type: "complete",
      });

      // ✅ Invalidate appointment queries so DataTable refreshes
      queryClient.invalidateQueries({ queryKey: ["appointments"] });

      setOpen(false);
    } catch (error) {
      console.error("Error performing complete action:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={`capitalize ${
            type === "schedule"
              ? "text-green-500"
              : type === "complete"
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {type}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`${
          type === "complete" ? "bg-gray-800 text-white" : "shad-dialog"
        } sm:max-w-md`}
      >
        <DialogHeader className="mb-4 space-y-3">
          <DialogTitle className="capitalize">
            {type === "complete"
              ? "Complete Appointment"
              : `${type} Appointment`}
          </DialogTitle>
          <DialogDescription>
            {type === "complete"
              ? `Are you sure you want to mark the appointment with Dr. ${appointment?.primaryPhysician} as completed?`
              : `Please fill in the following details to ${type} appointment`}
          </DialogDescription>
        </DialogHeader>

        {type === "complete" ? (
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleCompleteConfirm}
              className="bg-green-500 hover:bg-green-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        ) : (
          <AppointmentForm
            userId={userId}
            patientId={patientId}
            type={type}
            appointment={appointment}
            setOpen={setOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

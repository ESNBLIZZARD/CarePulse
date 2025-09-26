"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DoctorForm from "@/components/forms/DoctorForm";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { Doctor } from "@/types/appwrite.types";
import { ArrowLeft } from "lucide-react";

interface DoctorPageProps {
  params: { action: string; id?: string };
}

const DoctorFormPage = ({ params }: DoctorPageProps) => {
  const router = useRouter();
  const { action, id } = params;
  const [doctor, setDoctor] = useState<Doctor | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (action === "edit" && id) {
        const allDoctors = await getDoctors();
        const doc = allDoctors.find((d) => d.$id === id);
        setDoctor(doc);
      }
      setLoading(false);
    };
    fetchDoctor();
  }, [action, id]);

  const handleSuccess = () => {
    router.push("/admin/doctors");
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center h-[60vh]">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-lg">Loading doctor details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/doctors")}
        className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transition transform"
      >
        <ArrowLeft size={16} />
      </button>

      <h1 className="text-2xl font-bold mb-6 pt-5">
        {action === "edit" ? "Edit" : "Add"} Doctor
      </h1>

      <div className="p-6 rounded-lg shadow-md">
        <DoctorForm doctor={doctor} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default DoctorFormPage;
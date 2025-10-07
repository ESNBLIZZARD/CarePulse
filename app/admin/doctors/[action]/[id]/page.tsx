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
      <div className="p-6 max-w-3xl mx-auto min-h-[60vh]" role="status" aria-live="polite">
        {/* Main Container */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-4 sm:p-6 space-y-6">
          {/* Back Button Skeleton */}
          <div className="p-2 rounded-full bg-gray-700/50 w-10 h-10 animate-pulse"></div>

          {/* Title Skeleton */}
          <div className="h-8 bg-gray-700/50 rounded-md w-1/3 animate-pulse mb-6"></div>

          {/* Profile Photo Section Skeleton */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl" />
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[150px] sm:max-w-[200px]">
                  <div className="w-full h-full aspect-square rounded-full bg-gray-700/50 animate-pulse border-4 border-gray-900"></div>
                  <div className="absolute bottom-0 right-1/2 translate-x-8 p-2 rounded-full bg-gray-700/50 w-8 h-8 animate-pulse"></div>
                </div>
                <div className="w-full text-center space-y-2">
                  <div className="h-5 bg-gray-700/50 rounded-md w-1/2 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-gray-700/50 rounded-md w-3/4 mx-auto animate-pulse"></div>
                  <div className="h-3 bg-gray-700/50 rounded-md w-1/4 mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section Skeleton */}
          <div className="pt-4 border-t border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-700/50 w-10 h-10 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-700/50 rounded-md w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded-md w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-700/50 rounded-md w-1/3 animate-pulse"></div>
                      <div className="h-10 bg-gray-700/50 rounded-md w-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule Section Skeleton */}
          <div className="pt-4 border-t border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-700/50 w-10 h-10 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-700/50 rounded-md w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded-md w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded-md w-1/4 animate-pulse mb-2"></div>
                    <div className="h-16 bg-gray-700/50 rounded-md w-full animate-pulse"></div>
                    <div className="h-8 bg-gray-700/50 rounded-md w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className="flex justify-center">
            <div className="h-10 bg-gray-700/50 rounded-md w-full sm:w-1/2 animate-pulse"></div>
          </div>
        </div>
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
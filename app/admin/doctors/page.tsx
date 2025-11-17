"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDoctors, deleteDoctor } from "@/lib/actions/doctor.actions";
import { Doctor } from "@/types/appwrite.types";
import { ArrowLeft, SquarePen, Trash2, Stethoscope, Award, X } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import DoctorCard from "@/components/DoctorCard";

export default function DoctorsListPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchDoctors = async () => {
    setLoading(true);
    const allDoctors = await getDoctors();
    setDoctors(allDoctors);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const confirmDelete = async () => {
    if (selectedDoctor) {
      setDeleting(true);
      await deleteDoctor(selectedDoctor.$id!);
      setSelectedDoctor(null);
      setDeleting(false);
      fetchDoctors();
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-10 px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen">
      {/* Header */}
      <AdminHeader />

      {/* Title Section with Background Accent */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl" />
        <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4">
            {/* Top Row: Back Button + Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="group p-2 sm:p-3 rounded-xl bg-gray-800/80 text-gray-300 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/20 flex-shrink-0"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <Stethoscope className="text-blue-500 flex-shrink-0" size={24} />
                  <span className="truncate">Our Doctors</span>
                </h1>
              </div>

              {/* Add Button - Desktop */}
              <Link
                href="/admin/doctors/add/*"
                className="hidden sm:flex group relative px-4 lg:px-6 py-2 lg:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden flex-shrink-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Add Doctor</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            {/* Add Button - Mobile (Full Width) */}
            <Link
              href="/admin/doctors/add/*"
              className="sm:hidden group relative px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden text-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>Add Doctor</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {/* Stats Bar */}
            {!loading && (
              <div className="pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-2 text-gray-400">
                  <Award size={16} className="sm:w-[18px] sm:h-[18px] text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Total Doctors: <span className="text-white font-semibold">{doctors.length}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="group relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 shadow-xl overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
              <div className="relative p-6 flex flex-col items-center text-center">
                <div className="w-28 h-28 mb-5 rounded-full bg-gray-700/50" />
                <div className="h-6 w-3/4 bg-gray-700/50 rounded-lg mb-3" />
                <div className="h-4 w-1/2 bg-gray-600/50 rounded-lg mb-2" />
                <div className="h-4 w-1/3 bg-gray-600/50 rounded-lg" />
              </div>
            </div>
          ))
          : doctors.map((doctor) => (
            <DoctorCard
              key={doctor.$id}
              doctor={doctor}
              onEdit={(d) => router.push(`/admin/doctors/edit/${d.$id}`)}
              onDelete={(d) => setSelectedDoctor(d)}
            />
          ))}
      </div>

      {/* Empty State */}
      {!loading && doctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
            <Stethoscope size={48} className="text-gray-600" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">No Doctors Yet</h3>
          <p className="text-gray-400 mb-6">Start by adding your first medical professional</p>
          <Link
            href="/admin/doctors/add/*"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            Add Your First Doctor
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700 animate-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-600/50 flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              Confirm Deletion
            </h2>
            <p className="text-gray-300 mb-8 text-center leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-red-400 block mt-2 text-lg">
                {selectedDoctor.name}
              </span>
              <span className="text-sm text-gray-400 block mt-1">This action cannot be undone</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDoctor(null)}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/50 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
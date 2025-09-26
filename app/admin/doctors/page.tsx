"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDoctors, deleteDoctor } from "@/lib/actions/doctor.actions";
import { Doctor } from "@/types/appwrite.types";
import { ArrowLeft, LogOut, SquarePen, Trash2 } from "lucide-react";

export default function DoctorsListPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const router = useRouter();

  const fetchDoctors = async () => {
    setLoading(true);
    const allDoctors = await getDoctors();
    setDoctors(allDoctors);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const confirmDelete = async () => {
    if (selectedDoctor) {
      await deleteDoctor(selectedDoctor.$id!);
      setSelectedDoctor(null);
      fetchDoctors();
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col space-y-14">
      {/* Header */}
      <header className="admin-header flex items-center gap-6">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/admin" className="text-16-semibold">
            Dashboard
          </Link>
          <Link href="/admin/doctors" className="text-16-semibold">
            Doctors
          </Link>
          <button
            onClick={handleLogout}
            className=" text-white px-2 py-1 rounded-lg transition"
            title="Logout !"
          >
            <LogOut />
          </button>
        </nav>
      </header>
      <div className="px-6">
        {/* Page Title */}
        <div className="flex justify-between items-center my-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transition transform"
            >
              <ArrowLeft size={16} />
            </button>

            <h1 className="text-3xl font-bold text-white">
              <span className="block sm:hidden">Doctors</span>
              <span className="hidden sm:block">Our Doctors</span>
            </h1>
          </div>

          <Link
            href="/admin/doctors/add/*"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow 
             border border-transparent hover:border-white transition"
          >
            <span className="block sm:hidden">Add +</span>
            <span className="hidden sm:block">Add Doctor</span>
          </Link>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl shadow-md animate-pulse p-6 flex flex-col items-center text-center"
              >
                <div className="w-28 h-28 mb-4 rounded-full bg-gray-700" />
                <div className="h-5 w-3/4 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-600 rounded mb-1" />
                <div className="h-4 w-1/3 bg-gray-600 rounded" />
                <div className="mt-4 flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-700" />
                  <div className="h-8 w-8 rounded-lg bg-gray-700" />
                </div>
              </div>
            ))
            : doctors.map((doctor) => (
              <div
                key={doctor.$id}
                className="rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center"
              >
                {/* Profile Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 relative rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  {doctor.name}
                </h2>
                <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium mt-0.5">
                  {doctor.specialization}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  {doctor.experience} yrs exp
                </p>

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/admin/doctors/edit/${doctor.$id}`}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md transition"
                  >
                    <SquarePen size={16} />
                  </Link>
                  <button
                    onClick={() => setSelectedDoctor(doctor)}
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow hover:shadow-md transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Delete Confirmation Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Are you sure?
              </h2>
              <p className="text-gray-300 mb-6">
                Do you really want to delete{" "}
                <span className="font-medium text-red-400">{selectedDoctor.name}</span>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

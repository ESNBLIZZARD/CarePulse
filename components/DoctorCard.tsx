"use client";

import Image from "next/image";
import { Doctor } from "@/types/appwrite.types";
import { SquarePen, Trash2, Stethoscope, Award } from "lucide-react";

interface DoctorCardProps {
  doctor: Doctor;
  onEdit?: (doctor: Doctor) => void;
  onDelete?: (doctor: Doctor) => void;
}

export default function DoctorCard({ doctor, onEdit, onDelete }: DoctorCardProps) {
  return (
    <div className="group relative rounded-xl bg-gray-900 border border-gray-800 shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 overflow-hidden w-full sm:w-72 md:w-80">
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />

      <div className="relative p-4 sm:p-5 flex flex-col items-center text-center">
        {/* Profile Image */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse opacity-30" />
          <div className="absolute inset-1 rounded-full bg-gray-900 overflow-hidden border-2 sm:border-4 border-gray-800 shadow-lg">
            {doctor.imageUrl ? (
              <Image
                src={doctor.imageUrl}
                alt={doctor.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                <Stethoscope size={32} className="opacity-30" />
              </div>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <h2 className="font-semibold text-lg sm:text-xl text-white mb-1 group-hover:text-blue-400 truncate">
          {doctor.name}
        </h2>
        <p className="text-blue-400 text-xs sm:text-sm font-medium mb-2 truncate">{doctor.specialization}</p>

        <div className="flex items-center gap-1 mb-3">
          <Award size={14} className="text-yellow-400" />
          <span className="text-gray-300 text-xs sm:text-sm font-medium">{doctor.experience} yrs</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2 w-full">
          <button
            onClick={() => onEdit && onEdit(doctor)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-600/50 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow-blue-500/20 transition-all duration-300 text-xs sm:text-sm"
          >
            <SquarePen size={16} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete && onDelete(doctor)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm hover:shadow-red-500/20 transition-all duration-300 text-xs sm:text-sm"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const NavLinks = () => (
    <>
      <Link 
        href="/admin" 
        onClick={() => setIsOpen(false)} 
        className="text-16-semibold text-gray-300 hover:text-white transition-colors duration-200 relative group"
      >
        Dashboard
      </Link>
      <Link 
        href="/admin/doctors" 
        onClick={() => setIsOpen(false)} 
        className="text-16-semibold text-gray-300 hover:text-white transition-colors duration-200 relative group"
      >
        Doctors
      </Link>
      <Link 
        href="/admin/analytics" 
        onClick={() => setIsOpen(false)} 
        className="text-16-semibold text-gray-300 hover:text-white transition-colors duration-200 relative group"
      >
        Analytics
      </Link>
      <button
        title="Logout"
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-all duration-200 font-semibold hover:scale-105"
      >
        <LogOut size={18} className="transition-transform group-hover:translate-x-0.5"/> 
        Logout
      </button>
    </>
  );

  return (
    <header className="flex items-center rounded-lg justify-between px-6 py-4 bg-gradient-to-r from-black via-gray-900 to-black shadow-xl border-b border-gray-800/50 sticky top-0 z-50 backdrop-blur-sm">
      {/* Logo */}
      <Link href="/admin" className="cursor-pointer group">
        <div className="relative">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        </div>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <NavLinks />
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2.5 rounded-lg hover:bg-gray-800/80 text-white transition-all duration-200 hover:scale-110 border border-gray-700/50"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20}/> : <Menu size={20}/>}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Menu */}
          <div className="absolute top-16 right-4 bg-gradient-to-br from-gray-900 to-black shadow-2xl rounded-xl p-5 flex flex-col gap-4 w-52 md:hidden border border-gray-800/50 animate-in slide-in-from-top-2 duration-200">
            <NavLinks />
          </div>
        </>
      )}
    </header>
  );
}
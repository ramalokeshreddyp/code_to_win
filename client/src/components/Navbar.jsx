import React, { useEffect, useState } from "react";
import { GrCodepen } from "react-icons/gr";
import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./ui/NotificationDropdown";

const Navbar = ({ toggleSidebar }) => {
  // Replace this with your actual authentication logic
  const { logout, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
      : "text-gray-800 hover:text-blue-600 pb-1";
  return (
    <nav
      className={`${
        currentUser
          ? "bg-white shadow-lg border-b border-gray-200 sticky top-0 py-1 z-50"
          : "py-5"
      }`}
    >
      <div className={`mx-auto px-4 sm:px-6 lg:px-10 xl:px-40`}>
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <NavLink to={`/${currentUser?.role || ""}`}>
            <div className="flex flex-row items-center gap-3">
              <img src="/logo.svg" alt="" className="w-9 md:w-15" />
              <div className="border border-gray-500 h-10" />
              <img src="/au_logo.svg" alt="" className="md:w-14 w-8" />
              <h1 className="md:text-xl text-lg font-bold text-gray-800">
                CodeTracker
              </h1>
            </div>
          </NavLink>
          {/* Desktop Menu */}
          {!currentUser ? (
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/checkscore" className={linkClass}>
                Check Your Strength
              </NavLink>
              <NavLink to="/dev" className={linkClass}>
                Developers
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                Contact
              </NavLink>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <NotificationDropdown />
              <div className="flex items-center gap-2 font-medium p-2">
                <FiUser />
                {currentUser?.name}
                <span className="text-sm font-normal text-gray-500">
                  ({currentUser?.role})
                </span>
              </div>
            </div>
          )}
          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {!currentUser ? (
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="text-2xl text-gray-700 focus:outline-none "
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            ) : (
              <>
                <NotificationDropdown />
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-xl text-gray-700 hover:text-blue-800 focus:outline-none"
                >
                  <FiMenu />
                </button>
              </>
            )}
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col  gap-2 py-2 ">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/checkscore" onClick={() => setMobileMenuOpen(false)}>
              Check Your Strength
            </Link>
            <Link to="/dev" onClick={() => setMobileMenuOpen(false)}>
              Developers
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

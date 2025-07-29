import React from "react";
import { FaRegEnvelope } from "react-icons/fa6";
import { FiGithub, FiLinkedin } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#111827] border-t border-gray-200 pt-10 pb-5 px-6 text-base text-gray-400">
      <div className="max-w-6xl mx-auto flex md:flex-row flex-col justify-around  gap-y-8">
        {/* Logo and Description */}
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">
            Code Tracker
          </h2>
          <p className="mt-2 text-gray-400 md:max-w-xs">
            Helping students track and showcase their coding journey across
            multiple platforms.
          </p>
          <div className="flex space-x-4 mt-4 text-xl">
            <a href="#" aria-label="GitHub" className="hover:text-[#FFFFFF]">
              <FiGithub />
            </a>
            <a href="https://www.linkedin.com/school/adityauniversity/" aria-label="LinkedIn" className="hover:text-[#FFFFFF]">
              <FiLinkedin />
            </a>
            <a
              href="mailto:codetracker.contact@gmail.com"
              aria-label="Email"
              className="hover:text-[#FFFFFF]"
            >
              <FaRegEnvelope />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">Quick Links</h3>
          {[
            { label: "Home", link: "/" },
            { label: "Check Your Strength", link: "/checkscore" },
            { label: "Developers", link: "/dev" },
            { label: "Contact Us", link: "/contact" },
          ].map((items, index) => (


            <ul className="space-y-1" key={index}>
              <li>
                <NavLink to={items.link} className="hover:text-[#FFFFFF]">
                  {items.label}
                </NavLink>
              </li>

            </ul>))}
        </div>
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">KEY FEATURES</h3>
          <ul className="space-y-1">
            <li className="hover:text-[#FFFFFF] ">
              Dynamic Dashboards
            </li>
            <li className="hover:text-[#FFFFFF]">
              Live Ranking
            </li>
            <li className="hover:text-[#FFFFFF]">
              Check Score
            </li>
          </ul>
        </div>
        {/* Platforms */}
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">Platforms</h3>
          {[
            { label: "Leet Code", link: "https://leetcode.com/" },
            { label: "Code Chef", link: "https://www.codechef.com/" },
            { label: "Hacker Rank", link: "https://www.hackerrank.com/" },
            { label: "Geek for Geeks", link: "https://www.geeksforgeeks.com" },
          ].map((items, index) => (
            <ul className="space-y-1" key={index}>

              <li >
                <a
                  href={items.link}
                  className="hover:text-[#FFFFFF]"
                  target="_blank"
                >
                  {items.label}
                </a>
              </li>
            </ul>))}
        </div>
      </div>

      <div className="mt-10 text-center text-base text-gray-300 border-t border-gray-300 pt-6">
        © 2025 Aditya University. | Developed by{" "}
        <a href="https://ofzen.in/" className="text-gray-100 hover:underline font-medium">
          Ofzen.in
        </a>
      </div>
    </footer>
  );
};

export default Footer;

import React from "react";
import { motion } from "framer-motion";
const StatsCard = ({ icon, title, value, color }) => {
  const colorMap = {
    blue: "bg-[#eff6ff] text-[#1447e6] ",
    purple: "bg-[#faf5ff] text-[#9810fa]",
    success: "bg-[#f0fdf4] text-[#1c7800]",
    warning: "bg-[#fefce8] text-[#a96b00]",
    error: "bg-[#fef2f2] text-[#bc0000]",
  };

  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 md:p-4  text-center">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div className="ml-4 text-left">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="md:text-2xl text-lg font-semibold text-gray-900">
          {value}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

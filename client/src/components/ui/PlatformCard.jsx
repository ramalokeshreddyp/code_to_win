import React from "react";

const PlatformCard = ({
  name,
  color,
  icon,
  total,
  ani,
  breakdown,
  subtitle = "Problems Solved",
}) => (
  <div
    className={`bg-[#ffffff] p-4 rounded-xl shadow-sm hover:shadow-md duration-300 trasition-all w-full ${color}`} data-aos={`${ani}`}
  >
    <div className="flex  justify-between items-center md:mb-2 ">
      <h2 className="font-semibold text-base md:text-lg overflow-hidden max-w-lg">{name}</h2>
      <div >
        <img src={icon} alt={`${name} logo`} className="md:max-w-20 md:h-20 max-w-12 h-12 object-contain" />
      </div>
    </div>
    <div className="text-3xl font-bold">{total}</div>
    <div className="text-sm text-gray-500 mb-2">{subtitle}</div>
    {breakdown && (
      <div className="grid md:grid-cols-3  text-sm text-gray-700 space-x-3">
        {Object.entries(breakdown).map(([label, count]) => (
          <span key={label}>
            {label}: {count}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default PlatformCard;

import React, { useEffect, useState, useRef } from "react";
import PlatformCard from "./ui/PlatformCard";
import StatsCard from "./ui/StatsCard";
import { FiCheck, FiCode, FiDownload } from "react-icons/fi";
import { pdf } from "@react-pdf/renderer";
import { IoCloseCircle } from "react-icons/io5";
import PDFDocument from "../utils/PDFDocument";

const ViewProfile = ({ student, onClose }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<PDFDocument student={student} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        student?.name + "_" + student?.student_id || "profile"
      }.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setIsGeneratingPDF(false);
    } catch (error) {
      setIsGeneratingPDF(false);
      console.error("Error generating PDF:", error);
    }
  };
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-start justify-center h-screen overflow-scroll bg-[#00000055]  "
    >
      <div
        className="bg-[#f7f7f7] rounded-xl space-y-4 p-6 w-full flex flex-col items-center max-w-3xl shadow-lg relative"
        data-aos="fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Content */}
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="rounded-xl p-3 flex flex-col items-start gap-3 md:gap-6 justify-between bg-[#3370ff] text-[#ffffff] shadow-lg w-full">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="bg-[#ffffff4e] md:w-20 md:h-20 w-16 h-16 rounded-full flex items-center justify-center md:text-2xl text-xl font-semibold">
                {student?.name?.charAt(0)}
              </div>
              <div>
                <h2 className="md:text-lg text-md max-w-44 md:max-w-full font-semibold">
                  {student?.name}
                </h2>
                <span className="text-xs bg-[#ffffff] text-[#3370ff] px-2 py-0.5 rounded-full font-medium">
                  {student?.student_id}
                </span>
              </div>
            </div>
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 w-full text-sm font-medium text-[#ffffff] md:gap-y-3 gap-y-1">
              {[
                { label: "Campus", value: student?.college },
                { label: "Section", value: student?.section },
                { label: "Year", value: student?.year },
                { label: "Department", value: student?.dept_name },
                { label: "Degree", value: student?.degree },
              ].map((label, index) => (
                <div
                  key={index}
                  className="text-[#ffffffd6] flex md:flex-col flex-row gap-x-1"
                >
                  {label.label}:{label.value}
                </div>
              ))}
            </div>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            <StatsCard
              icon={<FiCode />}
              title="Total Problems"
              value={student?.performance?.combined?.totalSolved || 0}
              color="blue"
            />
            <StatsCard
              icon={<FiCheck />}
              title="Total Contests"
              value={student?.performance?.combined?.totalContests || 0}
              color="success"
            />
            <StatsCard
              icon={<FiCode />}
              title="Grand Total"
              value={student.score}
              color="warning"
            />
          </div>
          {/* Platform-wise Stats */}
          <div className="grid grid-cols-2  gap-2 md:gap-6 w-full">
            <PlatformCard
              name="LeetCode"
              icon="/LeetCode_logo.png"
              color=" hover:text-[#a96b00]  hover:shadow-[#a96b00] "
              total={
                student?.performance?.platformWise?.leetcode?.easy +
                student?.performance?.platformWise?.leetcode?.medium +
                student?.performance?.platformWise?.leetcode?.hard
              }
              breakdown={{
                Easy: student?.performance?.platformWise?.leetcode?.easy,
                Medium: student?.performance?.platformWise?.leetcode?.medium,
                Hard: student?.performance?.platformWise?.leetcode?.hard,
                Contests:
                  student?.performance?.platformWise?.leetcode?.contests,
                Badges: student?.performance?.platformWise?.leetcode?.badges,
              }}
            />
            <PlatformCard
              name="CodeChef"
              icon="/codechef_logo.png"
              color=" hover:text-[#a92700] hover:shadow-[#a92700]"
              total={student?.performance?.platformWise?.codechef?.contests}
              subtitle="Contests Participated"
              breakdown={{
                "problems Solved":
                  student?.performance?.platformWise?.codechef?.problems,
                Stars: student?.performance?.platformWise?.codechef?.stars,
                Badges: student?.performance?.platformWise?.codechef?.badges,
              }}
            />
            <PlatformCard
              name="GeeksforGeeks"
              icon="/GeeksForGeeks_logo.png"
              color=" hover:text-[#1c7800] hover:shadow-[#1c7800]"
              total={
                student?.performance?.platformWise?.gfg?.school +
                student?.performance?.platformWise?.gfg?.basic +
                student?.performance?.platformWise?.gfg?.easy +
                student?.performance?.platformWise?.gfg?.medium +
                student?.performance?.platformWise?.gfg?.hard
              }
              breakdown={{
                School: student?.performance?.platformWise?.gfg?.school,
                Basic: student?.performance?.platformWise?.gfg?.basic,
                Easy: student?.performance?.platformWise?.gfg?.easy,
                Medium: student?.performance?.platformWise?.gfg?.medium,
                Hard: student?.performance?.platformWise?.gfg?.hard,
              }}
            />
            <PlatformCard
              name="HackerRank"
              icon="/HackerRank_logo.png"
              color=" hover:text-black hover:shadow-black"
              total={student?.performance?.platformWise?.hackerrank?.badges}
              subtitle="Badges Gained"
              breakdown={{
                Badges: (
                  student?.performance?.platformWise?.hackerrank?.badgesList ||
                  []
                )
                  .map((badge) => `${badge.name}: ${badge.stars}★`)
                  .join(", "),
              }}
            />
            {student?.performance?.platformWise?.github?.repos > 0 && (
              <PlatformCard
                name="GitHub"
                icon="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                color=" hover:text-black hover:shadow-black"
                total={student?.performance?.platformWise?.github?.repos}
                subtitle="Public Repositories"
                breakdown={{
                  "Total Contributions":
                    student?.performance?.platformWise?.github?.contributions,
                }}
              />
            )}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 bg-blue-600 text-[#ffffff] px-3 py-1 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          <FiDownload />
          {isGeneratingPDF ? "Generating..." : "Download PDF"}
        </button>
        {/* X Close Button */}
        <button
          onClick={onClose}
          className=" absolute top-7 right-4 cursor-pointer rounded-xl px-4 py-1 text-[#ffffff] hover:text-gray-800 text-3xl font-bold focus:outline-none"
          aria-label="Close"
        >
          <IoCloseCircle />
        </button>
      </div>
    </div>
  );
};

export default ViewProfile;

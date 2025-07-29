import { TbUserShare } from "react-icons/tb";

const StudentTable = ({
  students = [],
  showBranch = true,
  showYear = true,
  showSection = true, // 👈 new prop
  onProfileClick = () => { },
}) => {
  return (
    <table className="min-w-full bg-white border rounded-lg overflow-hidden shadow text-xs md:text-base">
      <thead className="bg-gray-100 text-center">
        <tr>
          <th className="py-3 md:px-4 px-1">S.No</th>
          {/* 👈 dynamic column name */}
          <th className="py-3 md:px-4 px-1 text-left">Student</th>
          <th className="py-3 md:px-4 px-1">Roll Number</th>
          {showBranch && <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">Branch</th>}
          {showYear && <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">Year</th>}
          {showSection && <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">Section</th>}
          <th className="py-3 md:px-4 px-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        {students?.length > 0 ? (
          students.map((s, i) => (
            <tr
              key={s.student_id}
              className="hover:bg-gray-50 text-center" data-aos="fade-left"
            >
              <td className="py-3 px-4">{i + 1}</td>
              <td className="py-3 md:px-4  px-1 text-left flex items-center gap-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 hidden md:flex items-center text-sm justify-center font-bold">
                  {s.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                {s.name}
              </td>
              <td className="py-3 px-4">{s.student_id}</td>
              {showBranch && <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                {s.dept_name}
              </td>}
              {showYear && <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                {s.year}
              </td>}
              {showSection && <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                {s.section}
              </td>}
              <td className="py-3 md:px-4 px-1">
                <div
                  onClick={() => onProfileClick(s)}
                  className="text-gray-700 px-2 py-1 justify-center rounded hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <TbUserShare /><span className="hidden md:block">Profile</span>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="py-3 px-4 text-center">
              No students found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
export default StudentTable;

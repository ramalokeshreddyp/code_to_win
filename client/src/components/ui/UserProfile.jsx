import React from 'react'
import { FaUser } from 'react-icons/fa';

function UserProfile({ user }) {

  return (
    <div className="bg-blue-600 rounded-md p-4 md:p-6 text-white flex flex-col md:flex-row items-center justify-between w-full shadow-md gap-4">
      <div className="flex items-center flex-col md:flex-row">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-2 md:mb-0 md:mr-4">
          <FaUser className="text-white text-2xl" />
        </div>
        <div className="flex flex-col items-center md:items-start">
          <div className="text-xl font-semibold">{user?.name}</div>
          <div className="text-base">{user?.email}</div>
          <div className="mt-1">
            {user.dept_name &&
              <span className="text-base bg-blue-500 font-semibold text-white px-2 py-1 rounded-full">
                {user?.dept_name}  {user?.year ? " " + " - " + user.year : ""}
                {user?.section ? "" + " - " + user.section : ""}
              </span>}
          </div>
        </div>
      </div>
    </div>
  )
}
export default UserProfile;
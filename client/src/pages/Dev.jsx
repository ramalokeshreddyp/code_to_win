import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaGithub, FaLinkedin } from "react-icons/fa";
const developers = [
  {
    name: "Pavan Gollapalli",
    role: "Full Stack Developer",
    description:
      "Handles both frontend and backend development of the website. Integrates data from the scraper into the web app and ensures end-to-end functionality.",
    github: "https://github.com/gspavan07/",
    linkedin: "https://www.linkedin.com/in/shanmukpavan-gollapalli/",
    image: "https://github.com/gspavan07.png", // replace with actual image
  },
  {
    name: "Sunil Garbana",
    role: "Frontend Developer",
    description:
      "Designs and implements the user-facing part of the website using Reactjs and Tailwind CSS. Focuses on performance and user experience.",
    github: "https://github.com/sunilgarbana/",
    linkedin: "https://www.linkedin.com/in/sunil-garbana-186376274/",
    image: "https://github.com/sunilgarbana.png", // replace with actual image
  },
  {
    name: "Lalu Prasad",
    role: "Frontend Developer",
    description:
      "Designs and implements the user-facing part of the website using Reactjs and Tailwind CSS. Focuses on performance and user experience.",
    github: "https://github.com/Prasad-Arugollu",
    linkedin: "https://www.linkedin.com/in/prasadarugollu/",
    image: "/lalu.png", // replace with actual image
  },
  {
    name: "Charan Teja Neelam",
    role: "UI/UX Designer",
    description:
      "Designs the layout, appearance, and interaction flow of the website. Ensures that the interface is user-friendly, responsive, and visually appealing.",
    github: "https://github.com/Charantej111",
    linkedin: "https://www.linkedin.com/in/charan-tej-neelam-bb0a9a302/",
    image: "/charan.jpeg", // replace with actual image
  },
  {
    name: "Nareen kumar",
    role: "Scraper Engineer",
    description:
      "Builds and maintains scripts to extract data from external websites. Ensures scraped data is accurate, clean, and usable for integration into the application.",
    github: "https://github.com/mangamnareenkumar",
    linkedin: "https://www.linkedin.com/in/nareen-kumar-mangam-0aaa11254",
    image: "/nareen_hidden.png", // replace with actual image
  },
];

const Dev = () => {
  return (
    <>
      <Navbar />
      <section className="flex flex-col items-center px-5 py-10">
        <h1 className="text-3xl font-bold mb-2">Meet Our Developers</h1>
        <p className="text-gray-600 mb-10 text-center">
          The talented team behind the Coding Tracker
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 max-w-7xl" data-aos="fade-up">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg  hover:shadow-2xl overflow-hidden transition-shadow "
            >
              <div className="flex items-center justify-between p-5 bg-gray-200">
                <div className="flex flex-col justify-center items-start">
                  <h2 className="text-xl font-semibold">{dev.name}</h2>
                  <p className="text-sm text-gray-500">{dev.role}</p>
                </div>
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col p-5 justify-between">
                <p className="text-gray-600 text-sm">{dev.description}</p>

                <div className="flex items-center justify-center mt-5 gap-4">
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-gray-200 py-2 px-3 rounded-md text-sm text-gray-700 hover:text-black"
                  >
                    <FaGithub className="mr-1" /> GitHub Profile
                  </a>
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-gray-200 py-2 px-3 rounded-md text-sm text-gray-700 hover:text-black"
                  >
                    <FaLinkedin className="mr-1" /> LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Dev;

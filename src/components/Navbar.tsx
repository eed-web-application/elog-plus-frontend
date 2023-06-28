import elogLogo from "../assets/temp_elog_logo.png";
import cn from "classnames";

export default function Navbar({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap", className)}>
      <button className="text-center mb-3 w-full sm:mb-0 sm:w-auto">
        <img src={elogLogo} className="inline" alt="SLAC E-LOG logo" />
      </button>
      <form className="flex-1 mr-2 sm:mx-2">
        <div className="relative w-full">
          <input
            type="search"
            className="block pl-2.5 p-2 w-full text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search..."
            required
          />
          <button
            type="submit"
            className="absolute top-0 right-0 p-2.5 text-sm font-medium text-white bg-blue-500 rounded-r-lg border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:outline-none focus:ring-blue-300"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </button>
        </div>
      </form>
      <button className="px-2.5 bg-blue-500 rounded-lg text-white border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:outline-none focus:ring-blue-300">
        New Entry
      </button>
    </div>
  );
}

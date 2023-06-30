import cn from "classnames";
import { Link } from "react-router-dom";
import elogLogo from "../assets/temp_elog_logo.png";
import { Button, Input } from "./base";
import { HTMLProps } from "react";

export default function Navbar({
  className,
  ...rest
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap", className)} {...rest}>
      <button className="text-center mb-3 w-full sm:mb-0 sm:w-auto">
        <img src={elogLogo} className="inline" alt="SLAC E-LOG logo" />
      </button>
      <form className="flex-1 mr-2 sm:mx-2">
        <div className="relative w-full">
          <input
            type="search"
            className={cn("block w-full", Input)}
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
      <Link to="/new-entry" className={cn(Button)}>
        New Entry
      </Link>
    </div>
  );
}

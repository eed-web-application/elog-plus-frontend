import cn from "classnames";
import { Link } from "react-router-dom";
import elogLogo from "../assets/temp_elog_logo.png";
import { Button, Input } from "./base";
import { HTMLProps, useEffect, useState } from "react";

interface Props extends HTMLProps<HTMLDivElement> {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function Navbar({
  className,
  search,
  onSearchChange,
  ...rest
}: Props) {
  const [stagedSearch, setStagedSearch] = useState(search);

  useEffect(() => {
    setStagedSearch(search);
  }, [setStagedSearch, search]);

  return (
    <div className={cn("flex flex-wrap", className)} {...rest}>
      <Link to="/" className="text-center mb-3 w-full md:mb-0 md:w-auto">
        <img src={elogLogo} className="inline" alt="SLAC E-LOG logo" />
      </Link>
      <form
        className="flex-1 mr-2 md:mx-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchChange(stagedSearch);
        }}
      >
        <div className="relative w-full">
          <input
            type="search"
            className={cn("block w-full", Input)}
            placeholder="Search..."
            value={stagedSearch}
            onChange={(e) => setStagedSearch(e.target.value)}
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
      <Link
        to={{ pathname: "/new-entry", search: window.location.search }}
        className={Button}
      >
        New Entry
      </Link>
    </div>
  );
}

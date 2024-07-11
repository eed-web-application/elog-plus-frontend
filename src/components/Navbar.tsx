import { twJoin, twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { Button, Input } from "./base";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import { useDraftsStore } from "../draftsStore";
import Logo from "./Logo";
import DevSelectUser from "./DevSelectUser";

interface Props extends ComponentProps<"div"> {
  search: string;
  onSearchChange: (search: string) => void;
}

function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  timeout: number
): (...args: A) => void {
  let timer: number;

  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

export default function Navbar({
  className,
  search,
  onSearchChange,
  ...rest
}: Props) {
  const [stagedSearch, setStagedSearch] = useState(search);
  const hasNewEntryDraft = useDraftsStore(({ drafts }) =>
    Boolean(drafts["newEntry"])
  );

  const debouncedOnSearchChange = useMemo(
    () => debounce(onSearchChange, 500),
    [onSearchChange]
  );

  function searchFor(value: string) {
    setStagedSearch(value);
    debouncedOnSearchChange(value);
  }

  useEffect(() => {
    setStagedSearch(search);
  }, [setStagedSearch, search]);

  return (
    <div className={twMerge("flex flex-wrap", className)} {...rest}>
      <Link to="/" className="mb-3 w-full text-center md:mb-0 md:w-auto">
        <Logo className="inline" />
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
            className={twJoin(Input, "block w-full")}
            placeholder="Search..."
            value={stagedSearch}
            onChange={(e) => searchFor(e.target.value)}
          />
          <button
            type="submit"
            className="absolute top-0 right-0 p-1.5 text-sm font-medium text-white bg-blue-500 rounded-r-lg border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
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

      {import.meta.env.MODE === "development" && (
        <DevSelectUser className="mr-2" />
      )}

      <Link
        to={{ pathname: "/admin/logbooks" }}
        className={twJoin(Button, "mr-2 text-sm flex items-center")}
      >
        Admin Dashboard
      </Link>
      <Link
        to={{ pathname: "/new-entry", search: window.location.search }}
        className={twJoin(Button, "relative")}
      >
        New Entry
        {hasNewEntryDraft && (
          <div className="absolute top-0 right-0 w-4 h-4 text-black bg-gray-200 rounded-full shadow-xl translate-x-1.5 -translate-y-1.5 p-[3px]"></div>
        )}
      </Link>
    </div>
  );
}

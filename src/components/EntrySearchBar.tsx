import { twJoin } from "tailwind-merge";
import { Input } from "./base";
import { ComponentProps, useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";

export interface Props extends ComponentProps<"form"> {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function EntrySearchBar({
  search,
  onSearchChange,
  ...rest
}: Props) {
  const [stagedSearch, setStagedSearch] = useState(search);

  const debouncedOnSearchChange = useDebounce(onSearchChange, 500);

  function searchFor(value: string) {
    setStagedSearch(value);
    debouncedOnSearchChange(value);
  }

  useEffect(() => {
    setStagedSearch(search);
  }, [setStagedSearch, search]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearchChange(stagedSearch);
      }}
      {...rest}
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
  );
}

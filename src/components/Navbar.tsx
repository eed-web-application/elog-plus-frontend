import { twJoin, twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { Button } from "./base";
import { ComponentProps, useEffect, useState } from "react";
import { useDraftsStore } from "../draftsStore";
import Logo from "./Logo";
import DevSelectUser from "./DevSelectUser";
import useDebounce from "../hooks/useDebounce";
import Dialog from "./Dialog";
import InfoDialog from "./InfoDialog";
import BugReport from "./BugReport";
import EntrySearchBar, { Props as SearchProps } from "./EntrySearchBar";
import AccountButton from "./AccountButton";

export type Props = Pick<SearchProps, "search" | "onSearchChange"> &
  ComponentProps<"div">;

export default function Navbar({
  className,
  search,
  onSearchChange,
  ...rest
}: Props) {
  const [stagedSearch, setStagedSearch] = useState(search);
  const hasNewEntryDraft = useDraftsStore(({ drafts }) =>
    Boolean(drafts["newEntry"]),
  );

  const debouncedOnSearchChange = useDebounce(onSearchChange, 500);

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
      <EntrySearchBar
        className="flex-1 mr-2 md:mx-2"
        search={stagedSearch}
        onSearchChange={searchFor}
      />

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

      <BugReport />

      <Dialog>
        <Dialog.Content>
          <InfoDialog />
        </Dialog.Content>
        <Dialog.Trigger>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-2 w-8 h-8 p-1 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </Dialog.Trigger>
      </Dialog>

      <AccountButton className="ml-2 w-8 h-8 p-1 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer" />
    </div>
  );
}

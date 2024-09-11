import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { ComponentProps, useEffect, useState } from "react";
import Logo from "./Logo";
import EntrySearchBar, { Props as SearchProps } from "./EntrySearchBar";
import useDebounce from "../hooks/useDebounce";
import NavbarMenu from "./NavbarMenu";

export type Props = Pick<SearchProps, "search" | "onSearchChange"> &
  ComponentProps<"div">;

export default function Navbar({
  className,
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
    <div className={twMerge("flex flex-wrap gap-2", className)} {...rest}>
      <Link to="/" className="mb-3 w-full text-center md:mb-0 md:w-auto">
        <Logo className="inline" />
      </Link>
      <EntrySearchBar
        className="flex-1"
        search={stagedSearch}
        onSearchChange={searchFor}
      />

      <NavbarMenu />
    </div>
  );
}

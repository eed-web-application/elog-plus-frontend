import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import EntryList from "../components/EntryList";
import EntryRefreshContext from "../EntryRefreshContext";
import useEntries from "../hooks/useEntries";

const DEFAULT_FILTERS = {
  logbooks: [],
  tags: [],
  date: "",
};

export default function Home() {
  const [filters, setFilters] = useState<FiltersObject>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState("");

  function resetSearch() {
    setSearchText("");
    setFilters(DEFAULT_FILTERS);
  }

  const { hash } = useLocation();
  const spotlight = hash?.slice(1);
  const { refreshEntries, isLoading, entries, getMoreEntries, reachedBottom } =
    useEntries({
      ...filters,
      searchText,
      spotlight,
      onSpotlightFetched: resetSearch,
    });

  function onFiltersChange(filters: FiltersObject) {
    window.location.hash = "";
    setFilters(filters);
  }

  function onSearchChange(search: string) {
    window.location.hash = "";
    setSearchText(search);
  }

  return (
    <EntryRefreshContext.Provider value={refreshEntries}>
      <div className="h-screen flex flex-col">
        <div className="p-3 shadow z-10">
          <div className="container m-auto">
            <Navbar
              className="mb-1"
              search={searchText}
              onSearchChange={onSearchChange}
            />
            <Filters filters={filters} setFilters={onFiltersChange} />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className={"border-r px-3 overflow-y-auto flex-1"}>
            <EntryList
              entries={entries || []}
              emptyLabel="No entries found"
              isLoading={isLoading}
              selectable
              expandable
              showDayHeaders
              showFollowUps
              allowFollowUp
              allowSupersede
              allowSpotlightForFollowUps
              onBottomVisible={reachedBottom ? undefined : getMoreEntries}
              spotlight={hash?.slice(1) || undefined}
            />
          </div>
          <Outlet />
        </div>
      </div>
    </EntryRefreshContext.Provider>
  );
}

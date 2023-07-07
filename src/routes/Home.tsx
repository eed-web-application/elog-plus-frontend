import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { EntrySummary, fetchEntries } from "../api";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import EntryList from "../components/EntryList";
import EntryRefreshContext from "../EntryRefreshContext";
import { useEntriesStore } from "../entriesStore";

const ENTRIES_PER_LOAD = 25;
const DEFAULT_FILTERS = {
  logbooks: [],
  tags: [],
  date: "",
};

export default function Home() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [fetchingEntries, setFetchingEntries] = useState<boolean>(true);
  const [filters, setFilters] = useState<FiltersObject>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);

  const getOrFetch = useEntriesStore((state) => state.getOrFetch);
  const { hash } = useLocation();

  function fetchWithFilters(
    filters: FiltersObject,
    search: string,
    count: number = ENTRIES_PER_LOAD
  ) {
    setFetchingEntries(true);

    let date;
    if (filters.date) {
      date = new Date(filters.date);
      // Since we want to include all the entries in the same day of the date
      // and the backend only returns entries before the date, we make sure the
      // date is at the end of the day
      date.setUTCHours(23, 59, 59, 999);
      date = date.toISOString();
    }

    fetchEntries({
      logbooks: filters.logbooks,
      tags: filters.tags,
      search,
      anchorDate: date,
      numberAfterAnchor: count,
    }).then((entries) => {
      setEntries(entries);
      setFetchingEntries(false);
    });
  }

  function onFiltersChange(filters: FiltersObject) {
    setReachedBottom(false);
    setFilters(filters);
    fetchWithFilters(filters, search);
  }

  function onSearchChange(search: string) {
    setReachedBottom(false);
    setSearch(search);
    fetchWithFilters(filters, search);
  }

  useEffect(() => {
    const entryId = hash?.slice(1);

    if (!entryId) {
      return;
    }

    if (entries.some((entry) => entry.id === entryId)) {
      return;
    }

    setFilters(DEFAULT_FILTERS);
    setFetchingEntries(true);
    getOrFetch(entryId)
      .then((entry) =>
        fetchEntries({
          logbooks: [],
          anchorDate: entry.logDate,
          numberAfterAnchor: ENTRIES_PER_LOAD,
          numberBeforeAnchor: ENTRIES_PER_LOAD,
        })
      )
      .then((entries) => {
        setEntries(entries);
        setFetchingEntries(false);
      });
  }, [hash, entries, getOrFetch]);

  useEffect(() => {
    fetchEntries({
      numberAfterAnchor: ENTRIES_PER_LOAD,
    }).then((entries) => {
      setEntries(entries);
      setFetchingEntries(false);
    });
  }, []);

  async function fetchMoreEntries() {
    if (reachedBottom || fetchingEntries || !entries) {
      return;
    }

    setFetchingEntries(true);
    const newEntries = await fetchEntries({
      logbooks: filters.logbooks,
      numberAfterAnchor: ENTRIES_PER_LOAD,
      anchorDate: entries[entries.length - 1].logDate,
    });
    if (newEntries.length === 0) {
      setReachedBottom(true);
    }
    setEntries((entries) => entries?.concat(newEntries) || newEntries);
    setFetchingEntries(false);
  }

  async function refresh() {
    fetchWithFilters(filters, search, entries.length);
  }

  return (
    <EntryRefreshContext.Provider value={refresh}>
      <div className="h-screen flex flex-col">
        <div className="p-3 shadow z-10">
          <div className="container m-auto">
            <Navbar
              className="mb-1"
              search={search}
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
              isLoading={fetchingEntries}
              selectable
              expandable
              showDayHeaders
              allowFollowUp
              allowSupersede
              onBottomVisible={fetchMoreEntries}
              spotlight={hash?.slice(1) || undefined}
            />
          </div>
          <Outlet />
        </div>
      </div>
    </EntryRefreshContext.Provider>
  );
}

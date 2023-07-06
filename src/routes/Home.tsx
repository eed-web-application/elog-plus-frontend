import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { EntrySummary, fetchEntries } from "../api";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import EntryList from "../components/EntryList";

const ENTRIES_PER_LOAD = 25;

export default function Home() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [fetchingEntries, setFetchingEntries] = useState<boolean>(true);
  const [filters, setFilters] = useState<FiltersObject>({ logbooks: [] });
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);

  function onFiltersChanged(filters: FiltersObject) {
    setReachedBottom(false);
    setFilters(filters);

    setFetchingEntries(true);
    fetchEntries({
      logbooks: filters.logbooks,
      numberAfterAnchor: ENTRIES_PER_LOAD,
    }).then((entries) => {
      setEntries(entries);
      setFetchingEntries(false);
    });
  }

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

  return (
    <div className="max-h-screen flex flex-col">
      <div className="p-3 shadow z-10">
        <div className="container m-auto">
          <Navbar className="mb-3" />
          <Filters filters={filters} setFilters={onFiltersChanged} />
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
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

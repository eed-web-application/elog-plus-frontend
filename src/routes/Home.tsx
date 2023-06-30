import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { EntrySummary, fetchEntries } from "../api";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import EntryList from "../components/EntryList";

export default function Home() {
  const [entries, setEntries] = useState<EntrySummary[] | null>(null);
  const [filters, setFilters] = useState<FiltersObject>({ logbooks: [] });

  useEffect(() => {
    fetchEntries(filters.logbooks).then((entries) => setEntries(entries));
  }, [filters]);

  return (
    <div className="max-h-screen flex flex-col">
      <div className="p-3 shadow z-10">
        <div className="container m-auto">
          <Navbar className="mb-3" />
          <Filters filters={filters} setFilters={setFilters} />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className={"border-r px-3 overflow-y-auto flex-1"}>
          <EntryList
            entries={entries || []}
            emptyLabel="No entries found"
            isLoading={!entries}
            selectable
            expandable
            showDayHeaders
            allowFollowUp
            allowSupersede
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

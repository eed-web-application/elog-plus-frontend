import { useEffect, useState } from "react";
import cn from "classnames";
import { EntrySummary, fetchEntries } from "./api";
import Filters, { Filters as FiltersObject } from "./components/Filters";
import Navbar from "./components/Navbar";
import { useEntriesStore } from "./entriesStore";
import EntryPane, { PaneKind } from "./components/EntryPane";
import EntryList from "./components/EntryList";

function App() {
  const [entries, setEntries] = useState<EntrySummary[] | null>(null);
  const [paneFullscreen, setPaneFullscreen] = useState(false);
  const [filters, setFilters] = useState<FiltersObject>({ logbooks: [] });
  const [entryPane, setEntryPane] = useState<null | PaneKind>(null);
  const { getOrFetch } = useEntriesStore();

  useEffect(() => {
    fetchEntries(filters.logbooks).then((entries) => setEntries(entries));
  }, [filters]);
  function closePane() {
    setEntryPane(null);
  }

  function openNewEntryPane() {
    setEntryPane(["newEntry"]);
  }

  async function createdEntry(id: string) {
    const entry = await getOrFetch(id);
    setEntryPane(["viewingEntry", entry]);
  }

  async function select(entry: EntrySummary) {
    const fullEntry = await getOrFetch(entry.id);
    setEntryPane(["viewingEntry", fullEntry]);
  }

  async function followUp(entry: EntrySummary) {
    const fullEntry = await getOrFetch(entry.id);
    setEntryPane(["followingUp", fullEntry]);
  }

  async function supersede(entry: EntrySummary) {
    const fullEntry = await getOrFetch(entry.id);
    setEntryPane(["superseding", fullEntry]);
  }

  return (
    <div className="max-h-screen flex flex-col">
      <div className="p-3 shadow z-10">
        <div className="container m-auto">
          <Navbar className="mb-3" onNewEntry={openNewEntryPane} />
          <Filters filters={filters} setFilters={setFilters} />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            entryPane && !paneFullscreen ? "w-1/2" : "w-full",
            "border-r px-3 overflow-y-auto"
          )}
        >
          <EntryList
            entries={entries || []}
            emptyLabel="No entries found"
            isLoading={!entries}
            expandable
            showDayHeaders
            onSelect={select}
            onFollowUp={followUp}
            onSupersede={supersede}
          />
        </div>
        {entryPane && (
          <EntryPane
            kind={entryPane}
            fullscreen={paneFullscreen}
            setFullscreen={setPaneFullscreen}
            onCancel={closePane}
            onEntryCreated={createdEntry}
            onFollowUp={followUp}
            onSelect={select}
          />
        )}
      </div>
    </div>
  );
}

export default App;

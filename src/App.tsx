import { Fragment, useEffect, useState } from "react";
import cn from "classnames";
import { EntrySummary, fetchEntries } from "./api";
import Filters, { Filters as FiltersObject } from "./components/Filters";
import Navbar from "./components/Navbar";
import EntryRow from "./components/EntryRow";
import { useEntriesStore } from "./entriesStore";
import Spinner from "./components/Spinner";
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

  return (
    <div className="max-h-screen flex flex-col">
      <div className="p-3 shadow z-10">
        <div className="container m-auto">
          <Navbar className="mb-3" onNewEntry={openNewEntryPane} />
          <Filters filters={filters} setFilters={setFilters} />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <EntryList
          entries={entries || []}
          isLoading={!entries}
          previewable
          showDayHeaders
          onSelect={select}
          onFollowUp={followUp}
          onSupersede={() => undefined}
          className={entryPane && !paneFullscreen ? "w-1/2" : "w-full"}
        />
        {entryPane && (
          <EntryPane
            kind={entryPane}
            fullscreen={paneFullscreen}
            setFullscreen={setPaneFullscreen}
            onCancel={closePane}
            onEntryCreated={createdEntry}
          />
        )}
      </div>
    </div>
  );
}

export default App;

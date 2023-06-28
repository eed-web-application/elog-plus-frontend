import { Fragment, useEffect, useState } from "react";
import cn from "classnames";
import { Entry, EntrySummary, fetchEntries } from "./api";
import Filters, { Filters as FiltersObject } from "./components/Filters";
import Navbar from "./components/Navbar";
import EntryRow from "./components/EntryRow";
import { useEntriesStore } from "./entriesStore";
import Spinner from "./components/Spinner";
import EntryPane from "./components/EntryPane";

function App() {
  const [entries, setEntries] = useState<EntrySummary[] | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [paneFullscreen, setPaneFullscreen] = useState(false);
  const [filters, setFilters] = useState<FiltersObject>({ logbooks: [] });
  const { getOrFetch } = useEntriesStore();

  useEffect(() => {
    fetchEntries(filters.logbooks).then((entries) => setEntries(entries));
  }, [filters]);

  async function select(entryId: string) {
    const entry = await getOrFetch(entryId);
    setSelected(entry);
  }

  let currentDate: string | undefined;

  const paneOpen = selected || drafting;

  function closePane() {
    setSelected(null);
    setDrafting(false);
  }

  function openNewEntryPane() {
    setDrafting(true);
    setSelected(null);
  }

  async function createdEntry(id: string) {
    const entry = await getOrFetch(id);
    setSelected(entry);
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
            paneOpen && !paneFullscreen ? "w-1/2" : "w-full",
            Boolean(entries) && "bg-gray-100",
            "px-3 overflow-y-auto rounded-lg"
          )}
        >
          {entries ? (
            <>
              {entries.map((entry) => {
                let dateHeader;

                const entryDate = entry.logDate.substring(0, 10);
                if (entryDate !== currentDate) {
                  dateHeader = (
                    <h3
                      key={entry.logDate}
                      className="text-lg mt-2 pb-1 border-b"
                    >
                      {new Date(entry.logDate).toLocaleDateString("en-us", {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                  );

                  currentDate = entryDate;
                }

                return (
                  <Fragment key={entry.id}>
                    {dateHeader}
                    <EntryRow entry={entry} onSelected={select} />
                  </Fragment>
                );
              })}
            </>
          ) : (
            <Spinner large className="mt-4 m-auto" />
          )}
        </div>
        {paneOpen && (
          <EntryPane
            entry={selected || undefined}
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

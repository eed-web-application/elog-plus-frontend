import { Fragment, useEffect, useState } from "react";
import cn from "classnames";
import { Entry, EntrySummary, fetchEntries } from "./api";
import Filters, { Filters as FiltersObject } from "./components/Filters";
import Navbar from "./components/Navbar";
import EntryRow from "./components/EntryRow";
import { useEntriesStore } from "./entriesStore";
import Spinner from "./components/Spinner";
import EntryView from "./components/EntryView";

function App() {
  const [entries, setEntries] = useState<EntrySummary[] | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [filters, setFilters] = useState<FiltersObject>({ logbooks: [] });
  const { getOrFetch } = useEntriesStore();

  useEffect(() => {
    fetchEntries(filters.logbooks).then((entries) => setEntries(entries));
  }, [filters]);

  async function select(entryId: string) {
    const entry = await getOrFetch(entryId);
    setSelected(entry);
  }

  let currentDay: number | undefined;

  return (
    <div className="max-h-screen flex flex-col">
      <div className="p-3 shadow z-10">
        <div className="container m-auto">
          <Navbar className="mb-3" />
          <Filters filters={filters} setFilters={setFilters} />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            selected && !fullscreen ? "w-1/2" : "w-full",
            Boolean(entries) && "bg-gray-100",
            "px-3 overflow-y-auto rounded-lg"
          )}
        >
          {entries ? (
            <>
              {entries.map((entry) => {
                const entryDate = new Date(entry.logDate);
                let dateHeader;

                if (entryDate.getDate() !== currentDay) {
                  dateHeader = (
                    <h3
                      key={entryDate.getDate()}
                      className="text-lg mt-2 pb-1 border-b"
                    >
                      {entryDate.toLocaleDateString("en-us", {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                  );
                  currentDay = entryDate.getDate();
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
        {selected && (
          <EntryView
            entry={selected}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
            onCancel={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

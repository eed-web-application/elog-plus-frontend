import { Fragment, useEffect, useState } from "react";
import cn from "classnames";
import { Entry, EntrySummary, fetchEntries } from "./api";
import Filters, { Filters as FiltersObject } from "./components/Filters";
import Navbar from "./components/Navbar";
import EntryRow from "./components/EntryRow";
import { IconButton } from "./components/base";
import { useEntriesStore } from "./entriesStore";
import Spinner from "./components/Spinner";

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
          <>
            <div
              className={cn(
                "overflow-y-auto",
                "m-auto container absolute left-0 right-0 top-0 bottom-0 bg-white z-30 mt-6 rounded-lg",
                fullscreen ||
                  "sm:w-1/2 sm:relative sm:rounded-none sm:mt-0 sm:bg-transparent"
              )}
            >
              <div className="flex items-center px-1 pt-1">
                {fullscreen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={IconButton}
                    tabIndex={0}
                    onClick={() => setFullscreen(false)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={IconButton}
                      tabIndex={0}
                      onClick={() => setSelected(null)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                        className="block sm:hidden"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        className="hidden sm:block"
                      />
                    </svg>
                  </>
                )}

                <div className="flex-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                  {selected.title}
                </div>

                {fullscreen || (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={cn(IconButton, "sm:block hidden")}
                    tabIndex={0}
                    onClick={() => setFullscreen(true)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                )}
              </div>
              <div
                className="p-3 pt-2"
                dangerouslySetInnerHTML={{ __html: selected.text }}
              ></div>
            </div>
            <div
              className={cn(
                "absolute left-0 right-0 bottom-0 top-0 bg-gray-500 bg-opacity-50 z-20",
                fullscreen || "sm:hidden"
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;

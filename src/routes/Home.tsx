import { useCallback, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import cn from "classnames";
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

const MIN_PANE_WIDTH = 384;

export default function Home() {
  const [filters, setFilters] = useState<FiltersObject>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

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

  const outlet = useOutlet();

  const mouseMoveHandler = useCallback((e: MouseEvent) => {
    if (bodyRef.current && gutterRef.current) {
      const gutterRect = gutterRef.current.getBoundingClientRect();
      bodyRef.current.style.flexBasis =
        Math.max(e.clientX - gutterRect.width / 2, MIN_PANE_WIDTH) + "px";
    }
  }, []);

  const endDrag = useCallback(() => {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", endDrag);
  }, [mouseMoveHandler]);

  const startDrag = useCallback(() => {
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", endDrag);
  }, [mouseMoveHandler, endDrag]);

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
          <div
            className={cn(
              "px-3 overflow-y-auto w-1/2",
              !outlet && "flex-1 pr-3"
            )}
            ref={bodyRef}
          >
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
          {outlet && (
            <>
              <div
                className="relative border-r cursor-col-resize select-none"
                onMouseDown={startDrag}
                ref={gutterRef}
              >
                <div className="absolute -left-3 w-6 h-full" />
              </div>
              <div
                className="flex-1 flex-shrink overflow-y-auto pb-3"
                style={{ minWidth: MIN_PANE_WIDTH }}
              >
                {outlet}
              </div>
            </>
          )}
        </div>
      </div>
    </EntryRefreshContext.Provider>
  );
}

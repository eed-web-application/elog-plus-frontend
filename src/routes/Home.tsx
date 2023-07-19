import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useOutlet, useSearchParams } from "react-router-dom";
import cn from "classnames";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import EntryList from "../components/EntryList";
import EntryRefreshContext from "../EntryRefreshContext";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import { URLSearchParamsInit } from "react-router-dom";

const DEFAULT_QUERY: EntryQuery = {
  logbooks: [],
  tags: [],
  date: "",
  search: "",
};

const MIN_PANE_WIDTH = 384;

function deserializeQuery(params: URLSearchParams): EntryQuery {
  const query: EntryQuery = { ...DEFAULT_QUERY };

  for (const [key, value] of params.entries()) {
    // Typescript is being typescript and making things hard even though
    // I know they work... so please excuse all the weird types here.
    if (Array.isArray(DEFAULT_QUERY[key as keyof EntryQuery])) {
      query[key as keyof EntryQuery] = value.split(",") as string & string[];
    } else if (value) {
      query[key as keyof EntryQuery] = value as string & string[];
    }
  }

  return query;
}

function serializeQuery(query: EntryQuery): URLSearchParamsInit {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.entries(query).filter(([_, value]) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );
}

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const bodyRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => deserializeQuery(searchParams), [searchParams]);

  function setQuery(query: EntryQuery) {
    setSearchParams(serializeQuery(query));
  }

  function resetQuery() {
    setQuery(DEFAULT_QUERY);
  }

  const { hash } = useLocation();
  const spotlight = hash?.slice(1);
  const { refreshEntries, isLoading, entries, getMoreEntries, reachedBottom } =
    useEntries({
      ...query,
      spotlight,
      onSpotlightFetched: resetQuery,
    });

  function onFiltersChange(filters: FiltersObject) {
    window.location.hash = "";
    setQuery({ ...query, ...filters });
  }

  function onSearchChange(search: string) {
    window.location.hash = "";
    setQuery({ ...query, search });
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
              search={query.search}
              onSearchChange={onSearchChange}
            />
            <Filters filters={query} setFilters={onFiltersChange} />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div
            className={cn(
              "px-3 overflow-y-auto w-1/2",
              (!outlet || isSmallScreen) && "flex-1 pr-3"
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
              {!isSmallScreen && (
                <div
                  className="relative border-r cursor-col-resize select-none"
                  onMouseDown={startDrag}
                  ref={gutterRef}
                >
                  <div className="absolute -left-3 w-6 h-full" />
                </div>
              )}
              <div
                className={cn(
                  "overflow-y-auto pb-3",
                  !isSmallScreen && "flex-1 flex-shrink"
                )}
                style={{ minWidth: isSmallScreen ? "auto" : MIN_PANE_WIDTH }}
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutlet,
  useSearchParams,
} from "react-router-dom";
import { twJoin } from "tailwind-merge";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import { URLSearchParamsInit } from "react-router-dom";
import InfoDialogButton from "../components/InfoDialogButton";
import EntryListGrouped from "../components/EntryListGrouped";

const DEFAULT_QUERY: EntryQuery = {
  logbooks: [],
  tags: [],
  startDate: null,
  endDate: null,
  search: "",
  sortByLogDate: false,
};

const MIN_PANE_WIDTH = 384;

function deserializeQuery(params: URLSearchParams): EntryQuery {
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  return {
    logbooks: params.get("logbooks")?.split(",") ?? DEFAULT_QUERY.logbooks,
    tags: params.get("tags")?.split(",") ?? DEFAULT_QUERY.tags,
    startDate: startDate ? new Date(startDate) : DEFAULT_QUERY.startDate,
    endDate: endDate ? new Date(endDate) : DEFAULT_QUERY.endDate,
    search: params.get("search") ?? DEFAULT_QUERY.search,
    sortByLogDate: params.has("sortByLogDate"),
  };
}

function serializeQuery(query: EntryQuery): URLSearchParamsInit {
  return (
    Object.entries(query)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, value]) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      )
      .map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]) as [string, string][]
  );
}

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const bodyRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Although the spotlight state in stored in the location state,
  // this is used if the spotlighted entry is not loaded and thus needs to be
  // fetched.
  const [spotlightSearch, setSpotlightSearch] = useState<string | undefined>(
    undefined
  );
  const query = useMemo(() => deserializeQuery(searchParams), [searchParams]);
  const location = useLocation();
  const navigate = useNavigate();

  const setQuery = useCallback(
    (query: EntryQuery, preserveState = false) => {
      setSearchParams(serializeQuery(query), {
        replace: true,
        state: preserveState ? location.state : undefined,
      });
    },
    [location.state, setSearchParams]
  );

  const { isLoading, entries, getMoreEntries, reachedBottom } = useEntries({
    query,
    spotlight: spotlightSearch,
  });

  const spotlight = location.state?.spotlight;

  // This is used when the user uses spotlight but the spotlighted entry is not
  // already loaded. So, we use into a state of "spotlight search" where
  // this is used to back back into the normal state.
  const backToTop = useCallback(() => {
    setSpotlightSearch(undefined);
    // Delete state
    navigate({ search: window.location.search }, { replace: true });
  }, [navigate]);

  // Ensure the spotlighted element is loaded and if not set, setSpotlightSearch
  // to spotlight
  useEffect(() => {
    if (
      spotlightSearch !== spotlight &&
      entries !== undefined &&
      !entries.some((entry) => entry.id === spotlight)
    ) {
      setSpotlightSearch(spotlight);
      if (spotlight) {
        setQuery(DEFAULT_QUERY, true);
      }
    }
  }, [entries, spotlight, setQuery, spotlightSearch]);

  function onFiltersChange(filters: FiltersObject) {
    if (query.logbooks.join(",") !== filters.logbooks.join(",")) {
      filters.tags = [];
    }
    setQuery({ ...query, ...filters });
  }

  function onSearchChange(search: string) {
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
    <div className="h-screen flex flex-col">
      <div
        className={twJoin(
          "p-3 shadow z-10 relative",
          // Padding for the absolutely positioned info button
          !isSmallScreen && "px-12"
        )}
      >
        <div className="container m-auto">
          <Navbar
            className="mb-1"
            search={query.search}
            onSearchChange={onSearchChange}
          />

          <InfoDialogButton />
          <Filters filters={query} setFilters={onFiltersChange} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <EntryListGrouped
          containerClassName={twJoin(
            "w-1/2",
            (!outlet || isSmallScreen) && "flex-1"
          )}
          ref={bodyRef}
          entries={entries || []}
          emptyLabel="No entries found"
          selected={location.pathname.split("/")[1]}
          isLoading={isLoading}
          selectable
          expandable
          logbooksIncluded={query.logbooks}
          showFollowUps
          allowFollowUp
          allowSupersede
          allowSpotlightForFollowUps
          onBottomVisible={reachedBottom ? undefined : getMoreEntries}
          dateBasedOn={query.sortByLogDate ? "loggedAt" : "eventAt"}
          spotlight={spotlight}
          showBackToTopButton={Boolean(spotlightSearch)}
          onBackToTop={backToTop}
        />
        {outlet && (
          <>
            {!isSmallScreen && (
              <div
                className="relative border-r cursor-col-resize select-text"
                onMouseDown={startDrag}
                ref={gutterRef}
              >
                <div className="absolute -left-3 w-6 h-full select-text" />
              </div>
            )}
            <div
              className={twJoin(
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
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutlet,
  useSearchParams,
} from "react-router-dom";
import { yyyymmddToDate } from "../utils/datetimeConversion";
import { twJoin } from "tailwind-merge";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import InfoDialog from "../components/InfoDialog";
import Dialog from "../components/Dialog";
import EntryListGrouped from "../components/EntryListGrouped";
import serializeParams, { ParamsObject } from "../utils/serializeParams";
import SideSheet from "../components/SideSheet";
import useLogbooks from "../hooks/useLogbooks";

// Import Sidebar from your local UI library
// import Sidebar from "../../node_modules/ui/lib/Sidebar"; // Adjust the path as per your project structure

const DEFAULT_QUERY: EntryQuery = {
  logbooks: [],
  tags: [],
  requireAllTags: false,
  startDate: null,
  endDate: null,
  search: "",
  sortByLogDate: false,
  onlyFavorites: false,
};

function deserializeQuery(params: URLSearchParams): EntryQuery {
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  return {
    logbooks: params.get("logbooks")?.split(",") ?? DEFAULT_QUERY.logbooks,
    tags: params.get("tags")?.split(",") ?? DEFAULT_QUERY.tags,
    requireAllTags: params.has("requireAllTags"),
    startDate: startDate ? yyyymmddToDate(startDate) : DEFAULT_QUERY.startDate,
    endDate: endDate ? yyyymmddToDate(endDate) : DEFAULT_QUERY.endDate,
    search: params.get("search") ?? DEFAULT_QUERY.search,
    sortByLogDate: params.has("sortByLogDate"),
    onlyFavorites: params.has("onlyFavorites"),
  };
}

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const [searchParams, setSearchParams] = useSearchParams();
  const [spotlightSearch, setSpotlightSearch] = useState<string | undefined>(
    undefined,
  );
  const query = useMemo(() => deserializeQuery(searchParams), [searchParams]);
  const location = useLocation();
  const navigate = useNavigate();

  const setQuery = useCallback(
    (query: EntryQuery, preserveState = false) => {
      setSearchParams(serializeParams(query as ParamsObject), {
        replace: true,
        state: preserveState ? location.state : undefined,
      });
    },
    [location.state, setSearchParams],
  );

  const { isLoading: isLogbooksLoading, logbookNameMap } = useLogbooks();
  const {
    isLoading: isEntriesLoading,
    entries,
    getMoreEntries,
    reachedBottom,
  } = useEntries({
    enabled: !isLogbooksLoading,
    query: {
      ...query,
      logbooks: isLogbooksLoading
        ? []
        : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id),
    },
    spotlight: spotlightSearch,
  });

  const spotlight = location.state?.spotlight;

  const backToTop = useCallback(() => {
    setSpotlightSearch(undefined);
    navigate({ search: window.location.search }, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (
      spotlightSearch !== spotlight &&
      entries !== undefined &&
      !entries.some((entry) => entry.id === spotlight) &&
      spotlight
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

  const isLoading = isEntriesLoading || isLogbooksLoading;
  const includedLogbooks = isLogbooksLoading
    ? []
    : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id);

  return (
    <div className="flex flex-col h-full">
      <div
        className={twJoin(
          "p-3 shadow z-10 relative",
          !isSmallScreen && "px-12",
        )}
      >
        <div className="container m-auto">
          <Navbar
            className="mb-1"
            search={query.search}
            onSearchChange={onSearchChange}
          />
          <Dialog>
            <Dialog.Content>
              <InfoDialog />
            </Dialog.Content>
            <Dialog.Trigger>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={
                  "absolute m-3 top-0.5 right-0 w-8 h-8 p-1 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer"
                }
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </Dialog.Trigger>
          </Dialog>
          <Filters filters={query} setFilters={onFiltersChange} />
        </div>
      </div>
      {/* <Sidebar />  */}
      <SideSheet sheetBody={outlet}>
        <EntryListGrouped
          containerClassName="min-w-[384px] flex-1"
          entries={entries || []}
          emptyLabel="No entries found"
          selected={location.pathname.split("/")[1]}
          isLoading={isLoading}
          logbooksIncluded={includedLogbooks}
          showReferences
          showFollowUps
          allowFavorite
          allowFollowUp
          allowSupersede
          allowSpotlightForFollowUps
          onBottomVisible={reachedBottom ? undefined : getMoreEntries}
          dateBasedOn={query.sortByLogDate ? "loggedAt" : "eventAt"}
          spotlight={spotlight}
          showBackToTopButton={Boolean(spotlightSearch)}
          onBackToTop={backToTop}
        />
      </SideSheet>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutlet,
  useSearchParams,
} from "react-router-dom";
import { twJoin } from "tailwind-merge";
import { parse } from "date-fns";
import Filters, { Filters as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import InfoDialogButton from "../components/InfoDialogButton";
import EntryListGrouped from "../components/EntryListGrouped";
import serializeParams, { ParamsObject } from "../utils/serializeParams";
import SideSheet from "../components/SideSheet";

// Import Sidebar from your local UI library
import Sidebar from "../../node_modules/ui/lib/Sidebar"; // Adjust the path as per your project structure

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
    startDate: startDate
      ? parse(startDate, "yyyy-MM-dd", new Date())
      : DEFAULT_QUERY.startDate,
    endDate: endDate
      ? parse(endDate, "yyyy-MM-dd", new Date())
      : DEFAULT_QUERY.endDate,
    search: params.get("search") ?? DEFAULT_QUERY.search,
    sortByLogDate: params.has("sortByLogDate"),
    onlyFavorites: params.has("onlyFavorites"),
  };
}

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const [searchParams, setSearchParams] = useSearchParams();
  const [spotlightSearch, setSpotlightSearch] = useState<string | undefined>(
    undefined
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
    [location.state, setSearchParams]
  );

  const { isLoading, entries, getMoreEntries, reachedBottom } = useEntries({
    query,
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

  return (
    <div className="flex flex-col h-screen">
      <div
        className={twJoin(
          "p-3 shadow z-10 relative",
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

      <Sidebar /> {/* Integrate Sidebar component here */}

      <SideSheet sheetBody={outlet}>
        <EntryListGrouped
          containerClassName="min-w-[384px] flex-1"
          entries={entries || []}
          emptyLabel="No entries found"
          selected={location.pathname.split("/")[1]}
          isLoading={isLoading}
          logbooksIncluded={query.logbooks}
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

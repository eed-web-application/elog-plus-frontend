import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { twJoin } from "tailwind-merge";
import Filters, { FilterOptions as FiltersObject } from "../components/Filters";
import Navbar from "../components/Navbar";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import EntryListGrouped from "../components/EntryListGrouped";
import SideSheet from "../components/SideSheet";
import useLogbooks from "../hooks/useLogbooks";
import useEntryQuery, { DEFAULT_QUERY } from "../hooks/useEntryQuery";

// Import Sidebar from your local UI library
// import Sidebar from "../../node_modules/ui/lib/Sidebar"; // Adjust the path as per your project structure

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const [query, setEntryQuery] = useEntryQuery();
  const [spotlightSearch, setSpotlightSearch] = useState<string | undefined>(
    undefined,
  );
  const location = useLocation();
  const navigate = useNavigate();

  const setQuery = useCallback(
    (query: EntryQuery, preserveState = false) => {
      setEntryQuery(query, {
        replace: true,
        state: preserveState ? location.state : undefined,
      });
    },
    [location.state, setEntryQuery],
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
            onSearchChange={(search) => setQuery({ ...query, search })}
          />
          <Filters
            filters={query}
            onFiltersChange={(filters) => setQuery({ ...query, ...filters })}
          />
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

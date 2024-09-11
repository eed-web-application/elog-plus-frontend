import { useCallback, useMemo, useState } from "react";
import {
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
} from "react-router-dom";
import { twJoin } from "tailwind-merge";
import Filters from "../components/Filters";
import Navbar from "../components/Navbar";
import useEntries from "../hooks/useEntries";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { EntryQuery } from "../hooks/useEntries";
import EntryListGrouped from "../components/EntryListGrouped";
import SideSheet from "../components/SideSheet";
import useLogbooks from "../hooks/useLogbooks";
import useEntryQuery, { DEFAULT_QUERY } from "../hooks/useEntryQuery";
import { Entry } from "../api";
import serializeParams, { ParamsObject } from "../utils/serializeParams";
import SpotlightContext from "../SpotlightContext";

export default function Home() {
  const isSmallScreen = useIsSmallScreen();
  const [query, setEntryQuery] = useEntryQuery();
  const location = useLocation();
  const navigate = useNavigate();
  /**
   * The entry which should be highlighted in the list
   */
  const [spotlightEntryId, setSpotlightEntryId] = useState<string | null>(null);

  /**
   * If the spotlighted entry is not loaded in the list, then the hash will be
   * set to the entry's id. When the hash is set, the entries loaded will be
   * based on it (i.e., the entry with the id will always be loaded).
   */
  const anchoredEntryId = location.hash.slice(1);

  const { isLoading: isLogbooksLoading, logbookNameMap } = useLogbooks();

  const queryLogbookIds = useMemo(
    () =>
      isLogbooksLoading
        ? []
        : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id),
    [query.logbooks, logbookNameMap, isLogbooksLoading],
  );

  const {
    isLoading: isEntriesLoading,
    entries,
    getMoreEntries,
    reachedBottom,
  } = useEntries({
    enabled: !isLogbooksLoading,
    query: {
      ...query,
      logbooks: queryLogbookIds,
    },
    anchor: anchoredEntryId,
  });

  const spotlightEntry = useCallback(
    (entry: Entry) => {
      setSpotlightEntryId(entry.id);

      // If we are spotlighting an entry, and it is not in the list, then we need to
      // reset the query to ensure that the spotlighted entry is included, and then
      // set the location.hash ("spotlightSearch") to the entry's id.
      if (
        entries !== undefined &&
        !entries.some((loadedEntry) => loadedEntry.id === entry.id)
      ) {
        const newQuery: EntryQuery = {
          ...DEFAULT_QUERY,
        };

        // If the current query includes the logbook of the spotlighted entry,
        // then we don't need to add it to the new query. Otherwise, we add it
        // to the new query to ensure that the spotlighted entry is included.
        if (
          entry.logbooks.some((logbook) => queryLogbookIds.includes(logbook.id))
        ) {
          newQuery.logbooks = query.logbooks;
        } else {
          newQuery.logbooks = Array.from(
            new Set([
              ...query.logbooks,
              ...entry.logbooks.map((logbook) => logbook.name.toUpperCase()),
            ]),
          );
        }

        // Don't want to change the tags if we don't have to.
        if (
          entry.tags.some((tag) => query.tags.includes(tag.id)) &&
          !query.requireAllTags
        ) {
          newQuery.tags = query.tags;
        }

        navigate(
          {
            hash: entry.id,
            search: new URLSearchParams(
              serializeParams(newQuery as ParamsObject),
            ).toString(),
          },
          { replace: false },
        );
      }
    },
    [
      entries,
      navigate,
      query.logbooks,
      query.requireAllTags,
      query.tags,
      queryLogbookIds,
    ],
  );

  const backToTop = useCallback(() => {
    navigate({ search: window.location.search, hash: "" });
  }, [navigate]);

  const outlet = useOutlet();

  const isLoading = isEntriesLoading || isLogbooksLoading;
  const includedLogbooks = isLogbooksLoading
    ? []
    : query.logbooks.map((name) => logbookNameMap[name.toLowerCase()].id);

  const selected = useMatch({ path: "/:entryId" })?.params.entryId;

  return (
    <SpotlightContext.Provider value={spotlightEntry}>
      <div className="flex flex-col h-full">
        <div
          className={twJoin(
            "p-3 shadow z-10 relative",
            !isSmallScreen && "px-12",
          )}
        >
          <Navbar
            className="mb-1"
            search={query.search}
            onSearchChange={(search) =>
              setEntryQuery({ ...query, search }, { replace: true })
            }
          />
          <Filters
            filters={query}
            onFiltersChange={(filters) =>
              setEntryQuery({ ...query, ...filters }, { replace: true })
            }
          />
        </div>

        <SideSheet sheetBody={outlet}>
          <EntryListGrouped
            containerClassName="min-w-[384px] flex-1"
            entries={entries || []}
            emptyLabel="No entries found"
            selected={selected}
            isLoading={isLoading}
            logbooksIncluded={includedLogbooks}
            showReferences
            showFollowUps
            allowExpanding
            allowFavorite
            allowFollowUp
            allowSupersede
            allowSpotlightForFollowUps
            onBottomVisible={
              reachedBottom || isEntriesLoading ? undefined : getMoreEntries
            }
            dateBasedOn={query.sortByLogDate ? "loggedAt" : "eventAt"}
            spotlight={spotlightEntryId || undefined}
            showBackToTopButton={Boolean(anchoredEntryId)}
            onBackToTop={backToTop}
          />
        </SideSheet>
      </div>
    </SpotlightContext.Provider>
  );
}

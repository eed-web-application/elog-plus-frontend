import { useCallback, useEffect, useMemo } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";
import { Link } from "react-router-dom";
import dateToDateString from "../utils/dateToDateString";

function groupBy<K, V>(
  list: Array<V>,
  keyGetter: (input: V) => K
): Map<K, Array<V>> {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

export interface Props {
  entries: EntrySummary[];
  emptyLabel?: string;
  spotlight?: string;
  selected?: string;
  headerKind?: "shift" | "logbookShift" | "day" | "none";
  isLoading?: boolean;
  expandable?: boolean;
  selectable?: boolean;
  expandDefault?: boolean;
  showEntryDates?: boolean;
  showFollowUps?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
  allowSummarize?: boolean;
  onBottomVisible?: () => void;
}

/**
 * Customizable entry list supporting intermediate headers
 */
export default function EntryList({
  entries,
  emptyLabel,
  spotlight,
  selected,
  headerKind = "none",
  isLoading,
  expandable,
  selectable,
  expandDefault,
  showEntryDates,
  showFollowUps,
  allowFollowUp,
  allowSupersede,
  allowSpotlight,
  allowSpotlightForFollowUps,
  allowSummarize,
  onBottomVisible,
}: Props) {
  let currentHeader: string | undefined;

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          onBottomVisible?.();
        }
      }),
    [onBottomVisible]
  );

  const observe = useCallback(
    (elem: HTMLDivElement | null) => {
      if (elem) {
        observer.observe(elem);
      }
    },
    [observer]
  );

  useEffect(() => {
    return () => observer.disconnect();
  }, [observer]);

  const renderHeader = useCallback(
    (entry: EntrySummary) => {
      const date = entry.loggedAt.toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (headerKind === "day") {
        return date;
      }
      if (headerKind === "shift") {
        return `${entry.shift || "No shift"} • ${date}`;
      }
      if (headerKind === "logbookShift") {
        return `${entry.logbook} • ${entry.shift || "No shift"} • ${date}`;
      }
    },
    [headerKind]
  );

  if (entries.length === 0 && !isLoading && emptyLabel) {
    return (
      <div className="text-gray-500 text-center pt-6 text-lg">{emptyLabel}</div>
    );
  }

  const entryGroups = groupBy(entries, renderHeader);

  return (
    <>
      {Array.from(entryGroups, ([headerText, entries], groupIndex) => {
        let header;

        if (headerKind !== "none" && headerText !== currentHeader) {
          currentHeader = headerText;
          header = <h3 className="text-lg truncate">{headerText}</h3>;
        }

        return (
          <div
            key={headerText || "only key because headerKind == 'none'"}
            className="rounded-lg border mb-2 overflow-hidden"
          >
            {header && (
              <div className="flex justify-between items-center border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap">
                {header}
                {(headerKind === "shift" || headerKind === "logbookShift") &&
                  allowSummarize && (
                    <Link
                      to={{
                        pathname: "/new-entry",
                        search: window.location.search,
                      }}
                      state={{
                        logbook: entries[0].logbook,
                        summarize: {
                          shift: entries[0].shift,
                          date: dateToDateString(entries[0].eventAt),
                        },
                      }}
                      className="font-medium text-gray-700 hover:underline text-right"
                    >
                      Summarize shift
                    </Link>
                  )}
              </div>
            )}
            {entries.map((entry, entryIndex) => {
              const lastEntry =
                entryIndex === entries.length - 1 &&
                groupIndex === entryGroups.size - 1;
              return (
                <div
                  key={entry.id}
                  className={
                    entryIndex === entries.length - 1 ? "" : "border-b"
                  }
                  ref={lastEntry ? observe : undefined}
                >
                  <EntryRow
                    entry={entry}
                    spotlight={spotlight === entry.id}
                    expandable={expandable}
                    selectable={selectable}
                    showFollowUps={showFollowUps}
                    expandedByDefault={expandDefault}
                    showDate={showEntryDates}
                    allowFollowUp={allowFollowUp}
                    allowSupersede={allowSupersede}
                    allowSpotlight={allowSpotlight}
                    allowSpotlightForFollowUps={allowSpotlightForFollowUps}
                    selected={entry.id === selected}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {isLoading && <Spinner large className="my-4 m-auto" />}
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { EntrySummary, fetchShiftSummary } from "../api";
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

function getShiftIdent(entry: EntrySummary): string {
  return JSON.stringify([entry.shift?.id, dateToDateString(entry.loggedAt)]);
}

/**
 * Customizable entry list grouped by header types
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
  // Okay, shift summaries are a mess, so here what's going on:
  // With header kind "shift" or "logbookShift", we want to
  // display "View summary" linking to the summary if there exists a shift
  // summary or "Summarize shift" if there does no exist a shift summary.
  // However, we don't know if there exists a shift summary without first
  // fetching the server. So, once the entries are loaded, we go through each
  // one and map it to its "ShiftIdent" which just means a JSON string
  // of an array where the first element is the shiftId and the second is
  // the date of the shift. Then, we remove duplicates, and fetch the summaries
  // and load them into `shiftSummaries`. Then, to render the header with
  // the propery button, we convert the first entry of each block (which will
  // have the same shift and date as the others in the same block) to its
  // shiftIdent and finds it in `shiftSummaries`.
  const [shiftSummaries, setShiftSummaries] = useState<
    Record<string, string | null>
  >({});

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
        return `${entry.shift?.name || "No shift"} • ${date}`;
      }
      if (headerKind === "logbookShift") {
        return `${entry.logbook} • ${
          entry.shift?.name || "No shift"
        } • ${date}`;
      }
    },
    [headerKind]
  );

  const entryGroups = groupBy(entries, renderHeader);

  useEffect(() => {
    const needsToBeChecked = new Set(
      entries.filter((entry) => entry.shift).map(getShiftIdent)
    );
    needsToBeChecked.forEach(async (shiftIdent) => {
      if (shiftIdent in shiftSummaries) {
        return;
      }

      const [shiftId, date] = JSON.parse(shiftIdent);
      const summaryId = (await fetchShiftSummary(shiftId, date)) || null;
      setShiftSummaries((summaries) => ({
        ...summaries,
        [shiftIdent]: summaryId,
      }));
    });
  }, [entries]);

  if (entries.length === 0 && !isLoading && emptyLabel) {
    return (
      <div className="text-gray-500 text-center pt-6 text-lg">{emptyLabel}</div>
    );
  }

  return (
    <>
      {Array.from(entryGroups, ([headerText, entries], groupIndex) => {
        let header;

        if (headerKind !== "none" && headerText !== currentHeader) {
          currentHeader = headerText;
          header = <h3 className="text-lg truncate">{headerText}</h3>;
        }

        let summaryButton;
        const shiftIdent = entries[0] ? getShiftIdent(entries[0]) : undefined;

        if (
          (headerKind === "shift" || headerKind === "logbookShift") &&
          allowSummarize &&
          shiftIdent &&
          shiftIdent in shiftSummaries
        ) {
          const buttonBase =
            "font-medium text-gray-700 hover:underline text-right";
          if (shiftSummaries[shiftIdent]) {
            summaryButton = (
              <Link
                to={{
                  pathname: `/${shiftSummaries[shiftIdent]}`,
                  search: window.location.search,
                }}
                className={buttonBase}
              >
                View summary
              </Link>
            );
          } else {
            summaryButton = (
              <Link
                to={{
                  pathname: "/new-entry",
                  search: window.location.search,
                }}
                state={{
                  logbook: entries[0].logbook,
                  summarizes: {
                    shiftId: entries[0].shift?.id,
                    date: dateToDateString(entries[0].eventAt),
                  },
                }}
                className={buttonBase}
              >
                Summarize shift
              </Link>
            );
          }
        }

        return (
          <div
            key={headerText || "only key because headerKind == 'none'"}
            className="rounded-lg border mb-2 overflow-hidden"
          >
            {header && (
              <div className="flex justify-between items-center border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap">
                {header}
                {summaryButton}
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

import { Fragment, useCallback, useEffect, useMemo } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";
import { Link } from "react-router-dom";
import dateToDateString from "../utils/dateToDateString";

export interface Props {
  entries: EntrySummary[];
  emptyLabel?: string;
  spotlight?: string;
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
      const date = new Date(entry.loggedAt).toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (headerKind === "day") {
        return date;
      }
      if (headerKind === "shift") {
        return `${entry.shift} • ${date}`;
      }
      if (headerKind === "logbookShift") {
        return `${entry.logbook} • ${entry.shift} • ${date}`;
      }
    },
    [headerKind]
  );

  if (entries.length === 0 && !isLoading && emptyLabel) {
    return (
      <div className="text-gray-500 text-center pt-6 text-lg">{emptyLabel}</div>
    );
  }

  return (
    <>
      {entries.map((entry, index) => {
        const headerText = renderHeader(entry);
        let header;

        if (headerKind !== "none" && headerText !== currentHeader) {
          currentHeader = headerText;
          header = <h3 className="text-lg">{headerText}</h3>;
        }

        return (
          <Fragment key={entry.id}>
            {header && (
              <div className="flex justify-between items-center mt-2 pb-2 border-b pr-1 truncate gap-3">
                {header}
                {(headerKind === "shift" || headerKind === "logbookShift") &&
                  allowSummarize && (
                    <Link
                      to={{
                        pathname: "/new-entry",
                        search: window.location.search,
                      }}
                      state={{
                        logbook: entry.logbook,
                        summarize: {
                          shift: entry.shift,
                          date: dateToDateString(new Date(entry.eventAt)),
                        },
                      }}
                      className="font-medium text-gray-700 hover:underline text-right"
                    >
                      Summarize shift
                    </Link>
                  )}
              </div>
            )}
            <div
              className={index === entries.length - 1 ? "" : "border-b"}
              ref={index === entries.length - 1 ? observe : undefined}
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
              />
            </div>
          </Fragment>
        );
      })}

      {isLoading && <Spinner large className="my-4 m-auto" />}
    </>
  );
}

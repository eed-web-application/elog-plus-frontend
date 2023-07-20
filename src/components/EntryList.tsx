import { Fragment, useCallback, useEffect, useMemo } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";

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
  onBottomVisible?: () => void;
}

export default function EntryList({
  entries,
  emptyLabel,
  spotlight,
  headerKind = "logbookShift",
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
    return <div className="text-gray-500 text-center pt-3">{emptyLabel}</div>;
  }

  return (
    <>
      {entries.map((entry, index) => {
        const headerText = renderHeader(entry);
        let header;

        if (headerKind !== "none" && headerText !== currentHeader) {
          currentHeader = headerText;
          header = <h3 className="text-lg mt-2 pb-1 border-b">{headerText}</h3>;
        }

        return (
          <Fragment key={entry.id}>
            {header}
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
                expandedDefault={expandDefault}
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

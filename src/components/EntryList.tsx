import { Fragment, useCallback, useEffect, useMemo } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";

export interface Props {
  entries: EntrySummary[];
  emptyLabel: string;
  spotlight?: string;
  isLoading?: boolean;
  expandable?: boolean;
  selectable?: boolean;
  expandDefault?: boolean;
  showDayHeaders?: boolean;
  showEntryDates?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  onBottomVisible?: () => void;
}

export default function EntryList({
  entries,
  emptyLabel,
  spotlight,
  isLoading,
  expandable,
  selectable,
  expandDefault,
  showDayHeaders,
  showEntryDates,
  allowFollowUp,
  allowSupersede,
  allowSpotlight,
  onBottomVisible,
}: Props) {
  let currentDate: string | undefined;

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

  if (entries.length === 0 && !isLoading) {
    return <div className="text-gray-500 text-center">{emptyLabel}</div>;
  }

  return (
    <>
      {entries.map((entry, index) => {
        let dateHeader;

        const entryDate = entry.logDate.substring(0, 10);
        if (showDayHeaders && entryDate !== currentDate) {
          dateHeader = (
            <h3 key={entry.logDate} className="text-lg mt-2 pb-1 border-b">
              {new Date(entry.logDate).toLocaleDateString("en-us", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h3>
          );

          currentDate = entryDate;
        }

        return (
          <Fragment key={entry.id}>
            {dateHeader}
            <div
              className={index === entries.length - 1 ? "" : "border-b"}
              ref={index === entries.length - 1 ? observe : undefined}
            >
              <EntryRow
                entry={entry}
                spotlight={spotlight === entry.id}
                expandable={expandable}
                selectable={selectable}
                showFollowUps
                expandedDefault={expandDefault}
                showDate={showEntryDates}
                allowFollowUp={allowFollowUp}
                allowSupersede={allowSupersede}
                allowSpotlight={allowSpotlight}
              />
            </div>
          </Fragment>
        );
      })}

      {isLoading && <Spinner large className="my-4 m-auto" />}
    </>
  );
}

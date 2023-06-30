import { Fragment } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";

export interface Props {
  entries: EntrySummary[];
  emptyLabel: string;
  isLoading?: boolean;
  expandable?: boolean;
  selectable?: boolean;
  expandDefault?: boolean;
  showDayHeaders?: boolean;
  showEntryDates?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
}

export default function EntryList({
  entries,
  emptyLabel,
  isLoading,
  expandable,
  selectable,
  expandDefault,
  showDayHeaders,
  showEntryDates,
  allowFollowUp,
  allowSupersede,
}: Props) {
  let currentDate: string | undefined;

  if (isLoading) {
    return <Spinner large className="my-4 m-auto" />;
  }

  if (entries.length === 0) {
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
            <div className={index === entries.length - 1 ? "" : "border-b"}>
              <EntryRow
                entry={entry}
                expandable={expandable}
                selectable={selectable}
                showFollowUps
                expandedDefault={expandDefault}
                showDate={showEntryDates}
                allowFollowUp={allowFollowUp}
                allowSupersede={allowSupersede}
              />
            </div>
          </Fragment>
        );
      })}
    </>
  );
}

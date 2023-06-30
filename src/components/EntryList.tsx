import { Fragment } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";

export interface Props {
  entries: EntrySummary[];
  emptyLabel: string;
  isLoading?: boolean;
  expandable?: boolean;
  expandDefault?: boolean;
  showDayHeaders?: boolean;
  showEntryDates?: boolean;
  onSelect?: (entry: EntrySummary) => void;
  onFollowUp?: (entry: EntrySummary) => void;
  onSupersede?: (entry: EntrySummary) => void;
}

export default function EntryList({
  entries,
  emptyLabel,
  isLoading,
  expandable,
  expandDefault,
  showDayHeaders,
  showEntryDates,
  onSelect,
  onFollowUp,
  onSupersede,
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
                showFollowUps
                expandedDefault={expandDefault}
                showDate={showEntryDates}
                onSelect={onSelect ? (entry) => onSelect(entry) : undefined}
                onFollowUp={
                  onFollowUp ? (entry) => onFollowUp(entry) : undefined
                }
                onSupersede={
                  onSupersede ? (entry) => onSupersede(entry) : undefined
                }
              />
            </div>
          </Fragment>
        );
      })}
    </>
  );
}

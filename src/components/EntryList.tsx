import { Fragment } from "react";
import { EntrySummary } from "../api";
import EntryRow from "./EntryRow";
import Spinner from "./Spinner";

export interface Props {
  entries: EntrySummary[];
  isLoading?: boolean;
  previewable?: boolean;
  expandPreviewsDefault?: boolean;
  showDayHeaders?: boolean;
  showEntryDates?: boolean;
  onSelect?: (entry: EntrySummary) => void;
  onFollowUp?: (entry: EntrySummary) => void;
  onSupersede?: (entry: EntrySummary) => void;
}

export default function EntryList({
  entries,
  isLoading,
  previewable,
  expandPreviewsDefault,
  showDayHeaders,
  showEntryDates,
  onSelect,
  onFollowUp,
  onSupersede,
}: Props) {
  let currentDate: string | undefined;

  return (
    <>
      {isLoading ? (
        <Spinner large className="my-4 m-auto" />
      ) : (
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
                    previewable={previewable}
                    showFollowUps
                    expandedDefault={expandPreviewsDefault}
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
      )}
    </>
  );
}

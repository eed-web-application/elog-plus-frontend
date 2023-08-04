import { Link } from "react-router-dom";
import { EntrySummary } from "../api";
import dateToDateString from "../utils/dateToDateString";
import EntryRow from "./EntryRow";
import useSummary from "../hooks/useSummary";

export interface Props {
  entries: EntrySummary[];

  headerKind?: "shift" | "logbookAndShift" | "day" | "none";
  lastEntryRef?: (elem: HTMLDivElement) => void;

  selected?: string;
  spotlight?: string;
  expandable?: boolean;
  selectable?: boolean;
  expandDefault?: boolean;
  showEntryDates?: boolean;
  showFollowUps?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
}

export default function EntryGroup({
  entries,
  headerKind = "none",
  lastEntryRef,
  selected,
  spotlight,
  expandable,
  selectable,
  expandDefault,
  showEntryDates,
  showFollowUps,
  allowFollowUp,
  allowSupersede,
  allowSpotlight,
  allowSpotlightForFollowUps,
}: Props) {
  const representative = entries[0];
  const summaryId = useSummary(
    headerKind === "none" || headerKind === "day" || !representative
      ? undefined
      : representative.shift?.id,
    representative ? dateToDateString(representative.eventAt) : undefined
  );

  if (!representative) {
    return;
  }

  let headerText;
  if (headerKind !== "none") {
    headerText = new Date(representative.eventAt).toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (headerKind !== "day") {
      headerText = `${
        representative.shift ? representative.shift.name : "No shift"
      } • ${headerText}`;

      if (headerKind !== "shift") {
        headerText = `${representative.logbook.toUpperCase()} • ${headerText}`;
      }
    }
  }

  let summaryButton;

  if (summaryId !== undefined) {
    const buttonBase = "font-medium text-gray-700 hover:underline text-right";

    if (summaryId) {
      summaryButton = (
        <Link
          to={{
            pathname: `/${summaryId}`,
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
            logbook: representative.logbook,
            summarizes: {
              shiftId: representative.shift?.id,
              date: dateToDateString(representative.eventAt),
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
    <div className="rounded-lg border mb-2 overflow-hidden">
      {headerText && (
        <div className="flex justify-between items-center border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap">
          <h3 className="text-lg truncate">{headerText}</h3>
          {summaryButton}
        </div>
      )}
      {entries.map((entry, entryIndex) => {
        const isLastEntry = entryIndex === entries.length - 1;

        return (
          <div
            key={entry.id}
            className={isLastEntry ? "" : "border-b"}
            ref={isLastEntry ? lastEntryRef : undefined}
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
}

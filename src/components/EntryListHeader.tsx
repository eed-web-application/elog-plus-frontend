import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { Entry, EntrySummary } from "../api";
import useSummaries, { ShiftSummaryIdent } from "../hooks/useSummaries";
import { dateToYYYYMMDD } from "../utils/datetimeConversion";
import { ComponentProps, forwardRef } from "react";
import Chip from "./Chip";
import Tooltip from "./Tooltip";

export interface Props extends ComponentProps<"div"> {
  logbooksIncluded: string[];
  representative: EntrySummary | Entry;
  dateBasedOn?: "eventAt" | "loggedAt";
}

interface ShiftInfo {
  id: string;
  name: string;
  logbook?: string;
  logbookId?: string;
}

interface HeaderInfo {
  date: string;
  shifts: ShiftInfo[];
}

function getHeaderInfo(
  logbooksIncluded: string[],
  entry: EntrySummary | Entry,
  dateBasedOn: Props["dateBasedOn"] = "eventAt"
) {
  const date = dateBasedOn === "loggedAt" ? entry.loggedAt : entry.eventAt;

  const info: HeaderInfo = {
    date: new Date(date).toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    shifts: [],
  };

  if (logbooksIncluded.length > 0) {
    for (const shift of entry.shifts) {
      if (!logbooksIncluded.includes(shift.logbook.id)) {
        continue;
      }

      const shiftInfo: ShiftInfo = {
        id: shift.id,
        name: shift.name,
        logbookId: shift.logbook.id,
      };

      if (logbooksIncluded.length > 1) {
        shiftInfo.logbook = shift.logbook.name;
      }
      info.shifts.push(shiftInfo);
    }
  }

  return info;
}

function getHeaderKey(
  logbooksIncluded: string[],
  entry: EntrySummary | Entry,
  dateBasedOn: Props["dateBasedOn"] = "eventAt"
): string {
  return JSON.stringify(getHeaderInfo(logbooksIncluded, entry, dateBasedOn));
}

// eslint-disable-next-line react-refresh/only-export-components
const EntryListHeader = forwardRef<HTMLDivElement, Props>(
  (
    { logbooksIncluded, representative, dateBasedOn, className, ...rest },
    ref
  ) => {
    const date = dateToYYYYMMDD(
      dateBasedOn === "loggedAt"
        ? representative.loggedAt
        : representative.eventAt
    );

    let summaryButton;

    let shiftIds: ShiftSummaryIdent[] = [];

    if (logbooksIncluded.length > 0) {
      shiftIds = representative.shifts.map(({ id }) => ({
        shiftId: id,
        date,
      }));
    }

    const { summaries, isLoading: areSummariesLoading } =
      useSummaries(shiftIds);

    const { date: dateText, shifts } = getHeaderInfo(
      logbooksIncluded,
      representative,
      dateBasedOn
    );

    return (
      <div
        className={twMerge(
          "border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap",
          className
        )}
        ref={ref}
        {...rest}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg truncate">{dateText}</h3>
          {summaryButton}
        </div>
        <div className="flex gap-2">
          {!areSummariesLoading &&
            shifts.map(({ id, name, logbook, logbookId }, index) => {
              let label = name;

              if (logbook) {
                label = `${logbook?.toUpperCase()}:${label}`;
              }

              const summaryId = summaries[index];
              if (summaryId) {
                return (
                  <Tooltip key={index} label="View shift summary">
                    <Link
                      to={{
                        pathname: `/${summaryId}`,
                        search: window.location.search,
                      }}
                    >
                      <Chip
                        clickable
                        leftIcon={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 ml-1.5 mr-0.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        }
                      >
                        {label}
                      </Chip>
                    </Link>
                  </Tooltip>
                );
              } else {
                return (
                  <Tooltip key={index} label="Summarize shift">
                    <Link
                      to={{
                        pathname: "/new-entry",
                        search: window.location.search,
                      }}
                      state={{
                        logbooks: [logbookId],
                        summarizes: {
                          checked: true,
                          shiftId: id,
                          date: date,
                        },
                      }}
                    >
                      <Chip
                        clickable
                        leftIcon={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 ml-1.5 mr-0.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                            />
                          </svg>
                        }
                      >
                        {label}
                      </Chip>
                    </Link>
                  </Tooltip>
                );
              }
            })}
        </div>
      </div>
    );
  }
);

(
  EntryListHeader as typeof EntryListHeader & {
    getHeaderKey: typeof getHeaderKey;
  }
).getHeaderKey = getHeaderKey;
export default EntryListHeader as typeof EntryListHeader & {
  getHeaderKey: typeof getHeaderKey;
};

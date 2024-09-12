import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { Entry } from "../api";
import useSummaries, { ShiftSummaryIdent } from "../hooks/useSummaries";
import { dateToYYYYMMDD } from "../utils/datetimeConversion";
import { ComponentProps, forwardRef } from "react";
import Chip from "./Chip";
import Tooltip from "./Tooltip";
import useIsSmallScreen from "../hooks/useIsSmallScreen";

export interface Props extends ComponentProps<"div"> {
  logbooksIncluded: string[];
  representative: Entry;
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
  entry: Entry,
  dateBasedOn: Props["dateBasedOn"] = "eventAt",
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

// eslint-disable-next-line react-refresh/only-export-components
function ShiftButton({
  shift: { id, name, logbookId, logbook },
  summaryId,
  date,
}: {
  shift: ShiftInfo;
  summaryId?: string;
  date: string;
}) {
  let label = name;

  if (logbook) {
    label = `${logbook?.toUpperCase()}:${label}`;
  }

  if (summaryId) {
    return (
      <Tooltip label="View shift summary">
        <Link
          to={{
            pathname: `/${summaryId}`,
            search: window.location.search,
            hash: window.location.hash,
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
                className="mr-0.5 ml-1.5 w-4 h-4"
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
      <Tooltip label="Summarize shift">
        <Link
          to={{
            pathname: "/new-entry",
            search: window.location.search,
            hash: window.location.hash,
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
                className="mr-0.5 ml-1.5 w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
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
}

function getHeaderKey(
  logbooksIncluded: string[],
  entry: Entry,
  dateBasedOn: Props["dateBasedOn"] = "eventAt",
): string {
  return JSON.stringify(getHeaderInfo(logbooksIncluded, entry, dateBasedOn));
}

function useHeaderHeight() {
  return useIsSmallScreen() ? 60 : 40;
}

// eslint-disable-next-line react-refresh/only-export-components
const EntryListHeader = forwardRef<HTMLDivElement, Props>(
  (
    { logbooksIncluded, representative, dateBasedOn, className, ...rest },
    ref,
  ) => {
    const date = dateToYYYYMMDD(
      dateBasedOn === "loggedAt"
        ? representative.loggedAt
        : representative.eventAt,
    );

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
      dateBasedOn,
    );

    return (
      <div
        className={twMerge(
          "border-b px-3 bg-gray-100 whitespace-nowrap flex flex-wrap justify-between items-center md:gap-3 md:flex-nowrap content-center h-[60px] md:h-[40px]",
          className,
        )}
        ref={ref}
        {...rest}
      >
        <h3 className="text-lg truncate">{dateText}</h3>
        <div className="flex gap-2 w-full md:w-auto">
          {!areSummariesLoading &&
            shifts.map((shift, index) => (
              <ShiftButton
                key={shift.id}
                shift={shift}
                summaryId={summaries[index] || undefined}
                date={date}
              />
            ))}
        </div>
      </div>
    );
  },
);

(
  EntryListHeader as typeof EntryListHeader & {
    getHeaderKey: typeof getHeaderKey;
  }
).getHeaderKey = getHeaderKey;
(
  EntryListHeader as typeof EntryListHeader & {
    useHeaderHeight: typeof useHeaderHeight;
  }
).useHeaderHeight = useHeaderHeight;
export default EntryListHeader as typeof EntryListHeader & {
  getHeaderKey: typeof getHeaderKey;
  useHeaderHeight: typeof useHeaderHeight;
};

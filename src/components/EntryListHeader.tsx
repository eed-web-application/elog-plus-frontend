import cn from "classnames";
import { Link } from "react-router-dom";
import { EntrySummary } from "../api";
import useSummary from "../hooks/useSummary";
import dateToDateString from "../utils/dateToDateString";
import { ComponentProps, forwardRef } from "react";

export interface Props extends ComponentProps<"div"> {
  headerKind: "shift" | "logbookAndShift" | "day";
  representative: EntrySummary;
}

const EntryListHeader = forwardRef<HTMLDivElement, Props>(
  ({ headerKind, representative, className, ...rest }, ref) => {
    const summaryId = useSummary(
      headerKind === "day" || !representative
        ? undefined
        : representative.shift?.id,
      representative ? dateToDateString(representative.eventAt) : undefined
    );

    let headerText;
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
      <div
        className={cn(
          "flex justify-between items-center border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap",
          className
        )}
        ref={ref}
        {...rest}
      >
        <h3 className="text-lg truncate">{headerText}</h3>
        {summaryButton}
      </div>
    );
  }
);

export default EntryListHeader;

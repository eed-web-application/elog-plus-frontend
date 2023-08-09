import cn from "classnames";
import { Link } from "react-router-dom";
import { EntrySummary } from "../api";
import useSummary from "../hooks/useSummary";
import dateToDateString from "../utils/dateToDateString";
import { ComponentProps, forwardRef } from "react";

export type HeaderKind = "shift" | "logbookAndShift" | "day";

export interface Props extends ComponentProps<"div"> {
  headerKind: HeaderKind;
  representative: EntrySummary;
}

function headerTextRenderer(headerKind: HeaderKind, entry: EntrySummary) {
  let headerText = new Date(entry.eventAt).toLocaleDateString("en-us", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (headerKind !== "day") {
    headerText = `${
      entry.shift ? entry.shift.name : "No shift"
    } • ${headerText}`;

    if (headerKind !== "shift") {
      headerText = `${entry.logbook.toUpperCase()} • ${headerText}`;
    }
  }

  return headerText;
}

const EntryListHeader = forwardRef<HTMLDivElement, Props>(
  ({ headerKind, representative, className, ...rest }, ref) => {
    const summaryId = useSummary(
      headerKind === "day" || !representative
        ? undefined
        : representative.shift?.id,
      representative ? dateToDateString(representative.eventAt) : undefined
    );

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

    const headerText = headerTextRenderer(headerKind, representative);

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

(
  EntryListHeader as typeof EntryListHeader & {
    textRenderer: typeof headerTextRenderer;
  }
).textRenderer = headerTextRenderer;

export default EntryListHeader as typeof EntryListHeader & {
  textRenderer: typeof headerTextRenderer;
};

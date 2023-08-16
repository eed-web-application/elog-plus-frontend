import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { EntrySummary } from "../api";
import useSummary from "../hooks/useSummary";
import { dateToYYYYMMDD } from "../utils/datetimeConversion";
import { ComponentProps, forwardRef } from "react";

export type HeaderKind = "shift" | "logbookAndShift" | "day";

export interface Props extends ComponentProps<"div"> {
  headerKind: HeaderKind;
  representative: EntrySummary;
  dateBasedOn?: "eventAt" | "loggedAt";
}

function headerTextRenderer(
  headerKind: HeaderKind,
  entry: EntrySummary,
  dateBasedOn: Props["dateBasedOn"] = "eventAt"
) {
  const date = dateBasedOn === "loggedAt" ? entry.loggedAt : entry.eventAt;
  let headerText = new Date(date).toLocaleDateString("en-us", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (headerKind !== "day") {
    if (entry.shift.length > 0) {
      headerText = `${entry.shift
        .map(({ name }) => name)
        .join(", ")} • ${headerText}`;
    }

    if (headerKind !== "shift") {
      headerText = `${entry.logbooks
        .map(({ name }) => name.toUpperCase())
        .join(", ")} • ${headerText}`;
    }
  }

  return headerText;
}

// eslint-disable-next-line react-refresh/only-export-components
const EntryListHeader = forwardRef<HTMLDivElement, Props>(
  ({ headerKind, representative, dateBasedOn, className, ...rest }, ref) => {
    // FIXME: Disabled for now

    // const date =
    //   dateBasedOn === "loggedAt"
    //     ? representative.loggedAt
    //     : representative.eventAt;

    let summaryButton;

    // const summaryId = useSummary(
    //   headerKind === "day" || !representative
    //     ? undefined
    //     : representative.shift?.id,
    //   representative ? dateToYYYYMMDD(date) : undefined
    // );

    // if (summaryId !== undefined) {
    //   const buttonBase = "font-medium text-gray-700 hover:underline text-right";
    //
    //   if (summaryId) {
    //     summaryButton = (
    //       <Link
    //         to={{
    //           pathname: `/${summaryId}`,
    //           search: window.location.search,
    //         }}
    //         className={buttonBase}
    //       >
    //         View summary
    //       </Link>
    //     );
    //   } else {
    //     summaryButton = (
    //       <Link
    //         to={{
    //           pathname: "/new-entry",
    //           search: window.location.search,
    //         }}
    //         state={{
    //           logbook: representative.logbook,
    //           summarizes: {
    //             shiftId: representative.shift?.id,
    //             date: dateToYYYYMMDD(date),
    //           },
    //         }}
    //         className={buttonBase}
    //       >
    //         Summarize shift
    //       </Link>
    //     );
    //   }
    // }

    const headerText = headerTextRenderer(
      headerKind,
      representative,
      dateBasedOn
    );

    return (
      <div
        className={twMerge(
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

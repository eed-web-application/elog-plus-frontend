import { useRef } from "react";
import { EntrySummary } from "../api";
import EntryRow, { Props as EntryRowProps } from "./EntryRow";
import Spinner from "./Spinner";
import { useResizeObserver } from "../hooks/useOnResize";

export interface Props
  extends Pick<
    EntryRowProps,
    | "selectable"
    | "expandable"
    | "showFollowUps"
    | "expandedByDefault"
    | "showDate"
    | "allowFollowUp"
    | "allowSupersede"
    | "allowSpotlight"
    | "allowSpotlightForFollowUps"
  > {
  entries: EntrySummary[];
  selected?: string;
  spotlight?: string;
  isLoading?: boolean;
}

/**
 * Simple entry list
 */
export default function EntryList({
  entries,
  selected,
  spotlight,
  isLoading,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const Observer = useResizeObserver(ref.current);

  if (isLoading) {
    return <Spinner large className="mx-auto my-4" />;
  }

  if (entries.length === 0) {
    return;
  }

  return (
    <Observer>
      <div className="rounded-lg border mb-2 overflow-hidden" ref={ref}>
        {entries.map((entry, index) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            containerClassName={index === entries.length - 1 ? "" : "border-b"}
            highlighted={spotlight === entry.id}
            selected={entry.id === selected}
            {...rest}
          />
        ))}
      </div>
    </Observer>
  );
}

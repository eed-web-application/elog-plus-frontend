import { useRef } from "react";
import { Entry } from "../api";
import EntryRow, { Props as EntryRowProps } from "./EntryRow";
import Spinner from "./Spinner";
import { useResizeObserver } from "../hooks/useOnResize";

export interface Props
  extends Pick<
    EntryRowProps,
    | "showFollowUps"
    | "showReferences"
    | "expandedByDefault"
    | "showDate"
    | "allowFavorite"
    | "allowFollowUp"
    | "allowSupersede"
    | "allowSpotlight"
    | "allowSpotlightForFollowUps"
  > {
  entries: Entry[];
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
    return <Spinner large className="my-4 mx-auto" />;
  }

  if (entries.length === 0) {
    return;
  }

  return (
    <Observer>
      <div className="overflow-hidden mb-2 rounded-lg border" ref={ref}>
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

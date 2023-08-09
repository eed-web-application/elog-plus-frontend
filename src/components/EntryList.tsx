import { EntrySummary } from "../api";
import EntryRow, { Props as EntryRowProps } from "./EntryRow";
import Spinner from "./Spinner";

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
  if (isLoading) {
    return <Spinner large className="my-4 m-auto" />;
  }

  if (entries.length === 0) {
    return;
  }

  return (
    <div className="rounded-lg border mb-2 overflow-hidden">
      {entries.map((entry, index) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          containerClassName={index === entries.length - 1 ? "" : "border-b"}
          spotlight={spotlight === entry.id}
          selected={entry.id === selected}
          {...rest}
        />
      ))}
    </div>
  );
}

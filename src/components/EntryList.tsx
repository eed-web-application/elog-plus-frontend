import { useContext, useRef } from "react";
import { Entry } from "../api";
import EntryRow, { Props as EntryRowProps } from "./EntryRow";
import Spinner from "./Spinner";
import { useResizeObserver } from "../hooks/useOnResize";
import StickyEntryRow from "../StickyEntryRowContext";

export interface Props
  extends Pick<
    EntryRowProps,
    | "showFollowUps"
    | "showReferences"
    | "expandedByDefault"
    | "showDate"
    | "allowExpanding"
    | "allowFavorite"
    | "allowFollowUp"
    | "allowSupersede"
    | "allowSpotlight"
    | "allowSpotlightForFollowUps"
  > {
  header?: string;
  entries: Entry[];
  selected?: string;
  spotlight?: string;
  isLoading?: boolean;
  onEntryClick?: (entry: Entry) => void;
}

/**
 * Simple entry list
 */
export default function EntryList({
  entries,
  selected,
  spotlight,
  isLoading,
  header,
  onEntryClick,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const Observer = useResizeObserver(ref.current);

  const stickyHeader = headerRef.current?.getBoundingClientRect().height || 0;
  const { zIndex, usedHeight } = useContext(StickyEntryRow);

  if (isLoading) {
    return <Spinner large className="my-4 mx-auto" />;
  }

  if (entries.length === 0) {
    return;
  }

  return (
    <Observer>
      <div className="overflow-clip rounded-lg border" ref={ref}>
        {header && (
          <div
            ref={headerRef}
            className="border-b gap-3 px-3 pt-1.5 pb-1 bg-gray-100 whitespace-nowrap sticky text-black"
            style={{
              zIndex: zIndex,
              top: usedHeight,
            }}
          >
            {header}
          </div>
        )}
        <StickyEntryRow.Provider
          value={{
            zIndex: zIndex - 1,
            usedHeight: usedHeight + stickyHeader,
          }}
        >
          {entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              containerClassName={
                index === entries.length - 1 ? "" : "border-b"
              }
              highlighted={spotlight === entry.id}
              selected={entry.id === selected}
              onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
              {...rest}
            />
          ))}
        </StickyEntryRow.Provider>
      </div>
    </Observer>
  );
}

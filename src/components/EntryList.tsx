import { useCallback, useEffect, useMemo } from "react";
import { EntrySummary } from "../api";
import EntryGroup, { Props as EntryGroupProps } from "./EntryGroup";
import Spinner from "./Spinner";
import dateToDateString from "../utils/dateToDateString";

function rollingGroupBy<K, V>(
  list: Array<V>,
  groupBy: (input: V) => K
): [K, V[]][] {
  const groups: [K, V[]][] = [];
  let currentGroup: V[] | undefined;
  let currentGroupKey: K | undefined;

  list.forEach((item) => {
    const groupKey = groupBy(item);

    if (groupKey === currentGroupKey && currentGroup !== undefined) {
      currentGroup.push(item);
    } else {
      if (currentGroup && currentGroupKey) {
        groups.push([currentGroupKey, currentGroup]);
      }

      currentGroupKey = groupKey;
      currentGroup = [item];
    }
  });

  if (currentGroupKey && currentGroup) {
    groups.push([currentGroupKey, currentGroup]);
  }

  return groups;
}

export interface Props
  extends Omit<
    EntryGroupProps,
    "headerKind" | "summaryButton" | "lastEntryRef" | "headerKind"
  > {
  emptyLabel?: string;
  selected?: string;
  groupBy?: EntryGroupProps["headerKind"];
  isLoading?: boolean;
  onBottomVisible?: () => void;
}

/**
 * Customizable entry list grouped by header types
 */
export default function EntryList({
  entries,
  emptyLabel,
  groupBy = "none",
  isLoading,
  onBottomVisible,
  ...rest
}: Props) {
  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          onBottomVisible?.();
        }
      }),
    [onBottomVisible]
  );

  const observe = useCallback(
    (elem: HTMLDivElement | null) => {
      if (elem) {
        observer.observe(elem);
      }
    },
    [observer]
  );

  useEffect(() => {
    return () => observer.disconnect();
  }, [observer]);

  let entryGroups: [string, EntrySummary[]][] | undefined;
  if (groupBy !== "none") {
    let groupByFunc = (entry: EntrySummary) => dateToDateString(entry.eventAt);

    if (groupBy === "shift") {
      groupByFunc = (entry: EntrySummary) =>
        JSON.stringify([
          dateToDateString(entry.eventAt),
          entry.shift?.id || null,
        ]);
    } else if (groupBy === "logbookAndShift") {
      groupByFunc = (entry: EntrySummary) =>
        JSON.stringify([
          dateToDateString(entry.eventAt),
          entry.shift?.id || null,
          entry.logbook,
        ]);
    }

    entryGroups = rollingGroupBy(entries, groupByFunc);
  }

  if (entries.length === 0 && !isLoading && emptyLabel) {
    return (
      <div className="text-gray-500 text-center pt-6 text-lg">{emptyLabel}</div>
    );
  }

  return (
    <>
      {entryGroups ? (
        entryGroups.map(([key, entries], groupIndex) => (
          <EntryGroup
            key={key}
            entries={entries}
            lastEntryRef={
              entryGroups && groupIndex === entryGroups.length - 1
                ? observe
                : undefined
            }
            headerKind={groupBy}
            {...rest}
          />
        ))
      ) : (
        <EntryGroup entries={entries} />
      )}

      {isLoading && <Spinner large className="my-4 m-auto" />}
    </>
  );
}

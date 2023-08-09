import { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import cn from "classnames";
import { EntrySummary } from "../api";
import Spinner from "./Spinner";
import dateToDateString from "../utils/dateToDateString";
import {
  Range,
  defaultRangeExtractor,
  useVirtualizer,
} from "@tanstack/react-virtual";
import EntryRow from "./EntryRow";
import { Props as EntryListProps } from "./EntryList";
import EntryListHeader, {
  Props as EntryListHeaderProps,
} from "./EntryListHeader";
import { useMergeRefs } from "@floating-ui/react";

export interface Props extends EntryListProps {
  containerClassName: string;
  emptyLabel?: string;
  groupBy: EntryListHeaderProps["headerKind"];
  onBottomVisible?: () => void;
}

/**
 * Customizable entry list grouped by header types
 */
const EntryListGrouped = forwardRef<HTMLDivElement, Props>(
  (
    {
      entries,
      containerClassName,
      emptyLabel,
      groupBy,
      isLoading,
      onBottomVisible,
      selected,
      spotlight,
      ...rest
    },
    ref
  ) => {
    const parentRef = useRef<HTMLDivElement | null>(null);

    const [items, headerIndices] = useMemo(() => {
      let groupByFunc = (entry: EntrySummary) =>
        dateToDateString(entry.eventAt);

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

      const items = [];
      const headerIndices = [];
      let currentHeader = null;

      for (const entry of entries) {
        const header = groupByFunc(entry);

        if (header !== currentHeader) {
          currentHeader = header;

          headerIndices.push(items.length);
          items.push(entry);
        }

        items.push(entry);
      }

      return [items, headerIndices];
    }, [entries, groupBy]);

    const stickyHeaderIndexRef = useRef(0);

    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: useCallback(() => 50, []),
      rangeExtractor: useCallback(
        (range: Range) => {
          const topHeader = [...headerIndices]
            .reverse()
            .find((index) => index <= range.startIndex);

          const indices = defaultRangeExtractor(range);

          stickyHeaderIndexRef.current = topHeader || 0;
          if (!indices.includes(stickyHeaderIndexRef.current)) {
            indices.unshift(stickyHeaderIndexRef.current);
          }

          return indices;
        },
        [headerIndices]
      ),
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastVirtualItem = virtualItems[virtualItems.length - 1];

    useEffect(() => {
      if (!lastVirtualItem) {
        return;
      }

      if (lastVirtualItem.index >= items.length - 1) {
        onBottomVisible?.();
      }
    }, [lastVirtualItem, items.length, onBottomVisible]);

    const mergedRef = useMergeRefs([ref, parentRef]);

    if (entries.length === 0 && !isLoading && emptyLabel) {
      return (
        <div className="text-gray-500 text-center pt-6 text-lg">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div
        className={cn("overflow-x-auto h-full relative", containerClassName)}
        ref={mergedRef}
      >
        {items.length > 1 && (
          <>
            <div
              style={{ height: `${virtualizer.getTotalSize()}px` }}
              className="relative w-full"
            >
              <div
                className="w-full"
                style={{
                  transform: `translateY(${
                    virtualItems[1].start - virtualItems[0].size
                  }px)`,
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const entry = items[virtualRow.index];

                  if (headerIndices.includes(virtualRow.index)) {
                    return (
                      <EntryListHeader
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="sticky z-10"
                        style={{
                          top: `${
                            -virtualItems[1].start + virtualItems[0].size
                          }px`,
                        }}
                        headerKind={groupBy}
                        representative={entry}
                      />
                    );
                  }

                  return (
                    <EntryRow
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      entry={entry}
                      containerClassName="border-b"
                      className="px-2"
                      spotlight={spotlight === entry.id}
                      selected={entry.id === selected}
                      {...rest}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
        <Spinner
          large
          className={cn("my-4 m-auto", !isLoading && "invisible")}
        />
      </div>
    );
  }
);

export default EntryListGrouped;

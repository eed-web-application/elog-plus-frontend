import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { useMergeRefs } from "@floating-ui/react";
import Spinner from "./Spinner";
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
import { Link as LinkStyle } from "./base";

export interface Props extends EntryListProps {
  containerClassName: string;
  emptyLabel?: string;
  groupBy: EntryListHeaderProps["headerKind"];
  dateBasedOn?: EntryListHeaderProps["dateBasedOn"];
  onBottomVisible?: () => void;
  showBackToTopButton?: boolean;
  onBackToTop?: () => void;
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
      dateBasedOn,
      onBottomVisible,
      selected,
      spotlight,
      showBackToTopButton = false,
      onBackToTop,
      ...rest
    },
    ref
  ) => {
    const [prevSpotlight, setPrevSpotlight] = useState<string | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);

    const [items, headerIndices] = useMemo(() => {
      const items = [];
      const headerIndices = [];
      let currentHeader = null;

      for (const entry of entries) {
        const header = EntryListHeader.textRenderer(
          groupBy,
          entry,
          dateBasedOn
        );

        if (header !== currentHeader) {
          currentHeader = header;

          headerIndices.push(items.length);
          items.push(entry);
        }

        items.push(entry);
      }

      return [items, headerIndices];
    }, [entries, groupBy, dateBasedOn]);

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
      paddingStart: showBackToTopButton ? 50 : 0,
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

    useEffect(() => {
      if (!spotlight || prevSpotlight === spotlight) {
        return;
      }

      const index = items.findIndex((entry) => entry.id === spotlight);
      if (index === -1) {
        return;
      }

      virtualizer.scrollToIndex(index, {
        behavior: "smooth",
        align: "center",
      });
      setPrevSpotlight(spotlight);
    }, [spotlight, headerIndices, items, virtualizer, prevSpotlight]);

    if (entries.length === 0 && !isLoading && emptyLabel) {
      return (
        <div
          className={twMerge(
            "text-gray-500 text-center pt-6 text-lg",
            containerClassName
          )}
        >
          {emptyLabel}
        </div>
      );
    }

    return (
      <div
        className={twMerge(
          "overflow-x-auto h-full relative",
          containerClassName
        )}
        ref={mergedRef}
      >
        {items.length > 1 && (
          <>
            <div
              style={{ height: `${virtualizer.getTotalSize()}px` }}
              className="relative w-full"
            >
              {showBackToTopButton && (
                <div
                  tabIndex={0}
                  className={twMerge(
                    "w-full h-9 bg-gradient-to-b from-gray-200 block font-medium text-gray-700 hover:underline text-center pt-3 absolute top-0 z-10 cursor-pointer"
                  )}
                  onClick={onBackToTop}
                >
                  Back to top
                </div>
              )}
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
                      highlighted={spotlight === entry.id}
                      selected={entry.id === selected}
                      dateBasedOn={dateBasedOn}
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
          className={twMerge("mx-auto my-4", !isLoading && "invisible")}
        />
      </div>
    );
  }
);

export default EntryListGrouped;

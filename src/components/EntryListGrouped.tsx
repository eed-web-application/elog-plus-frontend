import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twJoin, twMerge } from "tailwind-merge";
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
import { useResizeObserver } from "../hooks/useOnResize";

export interface Props extends EntryListProps {
  containerClassName: string;
  emptyLabel?: string;
  logbooksIncluded: string[];
  dateBasedOn?: EntryListHeaderProps["dateBasedOn"];
  onBottomVisible?: () => void;
  showBackToTopButton?: boolean;
  onBackToTop?: () => void;
}

/**
 * Customizable entry list grouped by header types
 */
const EntryListGrouped = forwardRef<HTMLDivElement, Props>(
  function EntryListGrouped(
    {
      entries,
      containerClassName,
      emptyLabel,
      logbooksIncluded,
      isLoading,
      dateBasedOn,
      onBottomVisible,
      selected,
      spotlight,
      showBackToTopButton = false,
      onBackToTop,
      onEntryClick,
      ...rest
    },
    ref,
  ) {
    const [prevSpotlight, setPrevSpotlight] = useState<string | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    const Observer = useResizeObserver(parentRef.current);

    const [items, headerIndices] = useMemo(() => {
      const items = [];
      const headerIndices = [];
      let currentHeader = null;

      for (const entry of entries) {
        const header = EntryListHeader.getHeaderKey(
          logbooksIncluded,
          entry,
          dateBasedOn,
        );

        if (header !== currentHeader) {
          currentHeader = header;

          headerIndices.push(items.length);
          items.push(entry);
        }

        items.push(entry);
      }

      return [items, headerIndices];
    }, [entries, logbooksIncluded, dateBasedOn]);

    const stickyHeaderIndexRef = useRef(0);

    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: useCallback(() => 48, []),
      overscan: 25,
      measureElement(el) {
        // This extra space accounts for the margin between entry groups.
        // It is put on the last entry of the group, because once the last entry
        // is not rendered, then the whole group is not rendered and thus the
        // margin is no longer in the layout.
        if (el.getAttribute("data-last") === "true") {
          return el.getBoundingClientRect().height + 12;
        }
        return el.getBoundingClientRect().height;
      },
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
        [headerIndices],
      ),
      paddingStart: showBackToTopButton ? 50 : 0,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastVirtualItem = virtualItems[virtualItems.length - 1];
    const reachedBottom =
      lastVirtualItem && lastVirtualItem.index >= items.length - 1;

    useEffect(() => {
      if (reachedBottom) {
        onBottomVisible?.();
      }
    }, [reachedBottom, onBottomVisible]);

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
    }, [spotlight, items, virtualizer, prevSpotlight]);

    if (entries.length === 0 && !isLoading && emptyLabel) {
      return (
        <div
          className={twMerge(
            "text-gray-500 text-center pt-6 text-lg",
            containerClassName,
          )}
        >
          {emptyLabel}
        </div>
      );
    }

    let currentGroup: JSX.Element[] = [];
    let currentHeaderSize: number;

    let groups;

    if (items.length > 1) {
      groups = virtualItems.reduce<JSX.Element[]>((groups, virtualRow) => {
        const entry = items[virtualRow.index];

        if (headerIndices.includes(virtualRow.index)) {
          if (currentGroup.length > 0) {
            groups.push(
              <div
                key={currentGroup[0].key}
                className="mx-3 mt-3 rounded-lg border overflow-clip"
              >
                {currentGroup}
              </div>,
            );
          }

          currentGroup = [
            <EntryListHeader
              data-index={virtualRow.index}
              data-header
              key={`header_${entry.id}`}
              ref={virtualizer.measureElement}
              className="sticky"
              style={{
                top: `${Math.floor(
                  -virtualItems[1].start + virtualItems[0].size,
                )}px`,
                zIndex: 100,
              }}
              logbooksIncluded={logbooksIncluded}
              representative={entry}
            />,
          ];

          currentHeaderSize = virtualRow.size;

          return groups;
        }

        const isLastOfGroup = headerIndices.includes(virtualRow.index + 1);

        currentGroup.push(
          <EntryRow
            key={entry.id}
            data-index={virtualRow.index}
            data-last={isLastOfGroup}
            ref={virtualizer.measureElement}
            entry={entry}
            className="pr-2"
            containerClassName={isLastOfGroup ? "" : "border-b"}
            highlighted={spotlight === entry.id}
            selected={entry.id === selected}
            dateBasedOn={dateBasedOn}
            onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
            stickyTop={currentHeaderSize}
            depth={1}
            {...rest}
          />,
        );

        return groups;
      }, []);

      if (currentGroup.length > 1) {
        groups.push(
          <div
            key={currentGroup[0].key}
            className="mx-3 mt-3 rounded-lg border overflow-clip"
          >
            {currentGroup}
          </div>,
        );
      }
    }

    return (
      <Observer>
        <div
          className={twMerge(
            "overflow-x-auto h-full relative",
            containerClassName,
          )}
          ref={mergedRef}
        >
          {groups && (
            <>
              <div
                style={{ height: `${virtualizer.getTotalSize()}px` }}
                className="relative w-full"
              >
                {showBackToTopButton && (
                  <div
                    tabIndex={0}
                    className="block absolute top-0 z-10 pt-3 -mt-3 w-full h-9 font-medium text-center text-gray-700 bg-gradient-to-b from-gray-200 cursor-pointer hover:underline"
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
                  {groups}
                </div>
              </div>
            </>
          )}
          <Spinner
            large
            className={twJoin("mx-auto my-4", !isLoading && "invisible")}
          />
        </div>
      </Observer>
    );
  },
);

export default EntryListGrouped;

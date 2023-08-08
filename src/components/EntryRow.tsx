import cn from "classnames";
import {
  PropsWithChildren,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { Link, LinkProps } from "react-router-dom";
import {
  FloatingDelayGroup,
  FloatingPortal,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";
import { IconButton } from "./base";
import { EntrySummary } from "../api";
import EntryList from "./EntryList";
import Chip from "./Chip";
import EntryBodyText from "./EntryBodyText";
import Tooltip from "./Tooltip";
import EntryFigureList from "./EntryFigureList";
import useSpotlightProps from "../hooks/useSpotlightProps";
import { useDraftsStore } from "../draftsStore";
import useEntry from "../hooks/useEntry";

function RowButton({
  children,
  tooltip,
  entrySelected,
  entryHighlighted,
  onClick,
  marked = false,
  ...rest
}: PropsWithChildren<
  LinkProps & {
    tooltip: string;
    active?: boolean;
    entrySelected?: boolean;
    entryHighlighted?: boolean;
    marked?: boolean;
  }
>) {
  return (
    <Tooltip label={tooltip}>
      <Link
        className={cn(
          IconButton,
          "rounded-full z-0 relative",
          entrySelected && !entryHighlighted && "hover:!bg-blue-200",
          entryHighlighted && "hover:bg-yellow-300"
        )}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
        {marked && (
          <div className="absolute top-0.5 right-0.5 text-sm text-gray-500">
            *
          </div>
        )}
      </Link>
    </Tooltip>
  );
}

/**
 * Single line tag list supporting truncation based on available width and
 * an overflow drawer (an ellipsis that when hovered, displays the rest of the
 * tags with floating element)
 */
function TagList({ tags }: { tags: string[] }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [overflowIndex, setOverflowIndex] = useState<number | null>(null);
  const [drawerOffset, setDrawerOffset] = useState<number | null>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>(new Array(tags.length));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isDrawerOpen,
    onOpenChange: setIsDrawerOpen,
  });

  const mergedDrawerRef = useMergeRefs([refs.setReference, drawerRef]);

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Iterates through each tag checking if it is outside the bounds of its
  // parent. If one is found, then overflow index is set to its index, and
  // it and all tags after it are hidden. To position the drawer correctly, we
  // sum up width (and margin) of each visable tag and then position the drawer
  // with that offset.
  const updateTruncation = useCallback(() => {
    if (!containerRef.current || !drawerRef.current) {
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const drawerRect = drawerRef.current.getBoundingClientRect();
    let offset = 0;

    for (let i = 0; i < tagRefs.current.length; i++) {
      const el = tagRefs.current[i];
      if (!el) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      const margin =
        parseFloat(styles.marginRight) + parseFloat(styles.marginLeft);

      if (
        rect.right >
        containerRect.right -
          (overflowIndex === null || i === tagRefs.current.length - 1
            ? 0
            : drawerRect.width + margin)
      ) {
        setOverflowIndex(i);
        setDrawerOffset(offset);
        return;
      }

      offset += rect.width + margin;
    }

    setOverflowIndex(null);
  }, [overflowIndex]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const containerElem = containerRef.current;

    const observer = new ResizeObserver(() => {
      updateTruncation();
    });
    observer.observe(containerElem);

    return () => {
      observer.unobserve(containerElem);
      observer.disconnect();
    };
  }, [updateTruncation]);

  return (
    <div
      className="flex overflow-hidden relative w-full pointer-events-none"
      ref={(el) => (containerRef.current = el)}
    >
      {tags.map((tag, index) => (
        <Chip
          key={tag}
          className={cn(
            "ml-1.5",
            overflowIndex !== null && index >= overflowIndex && "invisible"
          )}
          ref={(el) => (tagRefs.current[index] = el)}
        >
          {tag}
        </Chip>
      ))}
      <Chip
        ref={mergedDrawerRef}
        {...getReferenceProps()}
        className={cn(
          "ml-1.5 absolute pointer-events-auto",
          overflowIndex === null && "invisible"
        )}
        style={{ left: `${drawerOffset}px` }}
        clickable
      >
        ...
      </Chip>
      {isDrawerOpen && overflowIndex !== null && (
        <FloatingPortal>
          <div
            className="shadow rounded-lg bg-white p-1.5 pb-0 mt-1 z-10"
            style={floatingStyles}
            ref={refs.setFloating}
            {...getFloatingProps()}
          >
            {tags.slice(overflowIndex).map((tag) => (
              <Chip key={tag} className="mb-1.5">
                {tag}
              </Chip>
            ))}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}

export interface Props {
  entry: EntrySummary;
  className?: string;
  spotlight?: boolean;
  selected?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  showFollowUps?: boolean;
  expandedByDefault?: boolean;
  showDate?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
}

/**
 * Horizontal summary of an entry supporting actions (such as follow up or
 * spotlight) and expanding to see the body content and follows ups.
 */
export default function EntryRow({
  entry,
  className,
  spotlight,
  selected,
  selectable,
  expandable,
  showFollowUps,
  expandedByDefault,
  showDate,
  allowFollowUp,
  allowSupersede,
  allowSpotlight,
  allowSpotlightForFollowUps,
}: PropsWithChildren<Props>) {
  const [expanded, setExpanded] = useState(Boolean(expandedByDefault));
  const fullEntry = useEntry(expanded ? entry.id : undefined, {
    critical: false,
    onError: () => setExpanded(false),
  });

  const [hasFollowUpDraft, hasSupersedingDraft] = useDraftsStore(
    ({ drafts }) => [
      Boolean(drafts[`followUp/${entry.id}`]),
      Boolean(drafts[`supersede/${entry.id}`]),
    ]
  );

  const rootRef = useCallback(
    (elem: HTMLDivElement) => {
      if (elem && spotlight) {
        elem.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    },
    [spotlight]
  );

  const spotlightProps = useSpotlightProps(entry.id);

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "flex items-center",
          selectable && "cursor-pointer relative",
          selected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50",
          spotlight && "bg-yellow-100 hover:bg-yellow-200",
          className
        )}
      >
        <div className="px-2 flex flex-col justify-center items-center w-16">
          {showDate && (
            <div className="text-sm">
              {entry.loggedAt.toLocaleDateString("en-us", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
          <div className="leading-none">
            {entry.loggedAt.toLocaleString("en-us", {
              hour: "numeric",
              minute: "numeric",
              hour12: false,
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col py-1 overflow-hidden">
          {selectable ? (
            <Link
              to={{ pathname: `/${entry.id}`, search: window.location.search }}
              // see https://inclusive-components.design/cards/
              className="truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0"
            >
              {entry.title}
            </Link>
          ) : (
            <div className="truncate leading-[1.2]">{entry.title}</div>
          )}
          <div className="flex items-center h-5">
            <div className="text-sm text-gray-500 leading-none whitespace-nowrap uppercase">
              {entry.logbook}
            </div>
            <div className="text-sm text-gray-500 leading-none whitespace-nowrap before:content-['•'] before:mx-1">
              {entry.loggedBy}
            </div>
            <TagList tags={entry.tags} />
          </div>
        </div>
        <div className="flex gap-2 pl-3">
          <FloatingDelayGroup delay={200}>
            {allowSpotlight && (
              <RowButton
                tooltip="Spotlight"
                entrySelected={selected}
                entryHighlighted={spotlight}
                {...spotlightProps}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </RowButton>
            )}

            {allowSupersede && (
              <RowButton
                tooltip="Supersede"
                to={{
                  pathname: `/${entry.id}/supersede`,
                  search: window.location.search,
                }}
                entrySelected={selected}
                entryHighlighted={spotlight}
                marked={hasSupersedingDraft}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                    className="absolute "
                  />
                </svg>
              </RowButton>
            )}

            {allowFollowUp && (
              <RowButton
                tooltip="Follow up"
                to={{
                  pathname: `/${entry.id}/follow-up`,
                  search: window.location.search,
                }}
                entrySelected={selected}
                entryHighlighted={spotlight}
                marked={hasFollowUpDraft}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
                  />
                </svg>
              </RowButton>
            )}
            {expandable && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                tabIndex={0}
                className={cn(
                  IconButton,
                  "z-0",
                  expanded && "rotate-180",
                  spotlight && "hover:bg-yellow-300",
                  selected && !spotlight && "hover:!bg-blue-200"
                )}
                onClick={() => setExpanded((expanded) => !expanded)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            )}
          </FloatingDelayGroup>
        </div>
      </div>
      {expanded && fullEntry && (
        <>
          <div
            className={cn(
              "p-2 pb-1 bg-gray-100",
              fullEntry.text || "text-gray-500"
            )}
          >
            <EntryBodyText body={fullEntry.text} showEmptyLabel />
            <EntryFigureList attachments={fullEntry.attachments} />
          </div>
          {showFollowUps && (
            <div className="ml-6 pt-2 pr-2">
              <EntryList
                entries={fullEntry.followUps}
                selectable
                expandable
                showEntryDates
                showFollowUps={showFollowUps}
                allowFollowUp={allowFollowUp}
                allowSupersede={allowSupersede}
                allowSpotlight={allowSpotlightForFollowUps}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

import cn from "classnames";
import {
  PropsWithChildren,
  useCallback,
  useContext,
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
import { useEntriesStore } from "../entriesStore";
import { Entry, EntrySummary } from "../api";
import EntryList from "./EntryList";
import Tag from "./Tag";
import EntryBody from "./EntryBody";
import IsPaneFullscreen from "../IsPaneFullscreenContext";
import Tooltip from "./Tooltip";

function RowButton({
  children,
  to,
  tooltip,
  highlighted,
}: PropsWithChildren<
  LinkProps & {
    tooltip: string;
    active?: boolean;
    highlighted?: boolean;
  }
>) {
  return (
    <Tooltip label={tooltip}>
      <Link
        to={to}
        className={cn(
          IconButton,
          "rounded-full z-0",
          highlighted && "hover:bg-yellow-300"
        )}
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Link>
    </Tooltip>
  );
}

function TagList({ tags }: { tags: string[] }) {
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [stoppingPoint, setStoppingPoint] = useState<number | null>(null);
  const [ellipsisOffset, setEllipsisOffset] = useState<number | null>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>(new Array(tags.length));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ellipsisRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isTagsOpen,
    onOpenChange: setIsTagsOpen,
  });

  const mergedEllipsisRef = useMergeRefs([refs.setReference, ellipsisRef]);

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

  const truncate = useCallback(() => {
    if (!containerRef.current || !ellipsisRef.current) {
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const ellipsisRect = ellipsisRef.current.getBoundingClientRect();
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
          (stoppingPoint === null ? 0 : ellipsisRect.width + margin)
      ) {
        setStoppingPoint(i);
        setEllipsisOffset(offset);
        return;
      }

      offset += rect.width + margin;
    }

    setStoppingPoint(null);
  }, [stoppingPoint]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const containerElem = containerRef.current;

    const observer = new ResizeObserver(() => {
      truncate();
    });
    observer.observe(containerElem);

    return () => {
      observer.unobserve(containerElem);
      observer.disconnect();
    };
  }, [truncate]);

  return (
    <div
      className="flex overflow-hidden relative w-full"
      ref={(el) => (containerRef.current = el)}
    >
      {tags.map((tag, index) => (
        <Tag
          key={tag}
          className={cn(
            "ml-1.5",
            stoppingPoint !== null && index >= stoppingPoint && "invisible"
          )}
          ref={(el) => (tagRefs.current[index] = el)}
        >
          {tag}
        </Tag>
      ))}
      <Tag
        ref={mergedEllipsisRef}
        {...getReferenceProps()}
        className={cn(
          "ml-1.5 z-0 absolute",
          stoppingPoint === null && "invisible"
        )}
        style={{ left: `${ellipsisOffset}px` }}
        clickable
      >
        ...
      </Tag>
      {isTagsOpen && stoppingPoint !== null && (
        <FloatingPortal>
          <div
            className="shadow rounded-lg bg-white p-1.5 pb-0 mt-1 z-10"
            style={floatingStyles}
            ref={refs.setFloating}
            {...getFloatingProps()}
          >
            {tags.slice(stoppingPoint).map((tag) => (
              <Tag key={tag} className="mb-1.5">
                {tag}
              </Tag>
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
  selectable?: boolean;
  expandable?: boolean;
  showFollowUps?: boolean;
  expandedDefault?: boolean;
  showDate?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
}

export default function EntryRow({
  entry,
  className,
  spotlight,
  selectable,
  expandable,
  showFollowUps,
  expandedDefault,
  showDate,
  allowFollowUp,
  allowSupersede,
  allowSpotlight,
  allowSpotlightForFollowUps,
}: PropsWithChildren<Props>) {
  const [expanded, setExpanded] = useState(Boolean(expandedDefault));
  const [fullEntry, setFullEntry] = useState<Entry | null>(null);

  const getOrFetch = useEntriesStore((state) => state.getOrFetch);

  async function toggleExpand(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();

    setFullEntry(await getOrFetch(entry.id));
    setExpanded((expanded) => !expanded);
  }

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

  const isPaneFullscreen = useContext(IsPaneFullscreen);

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "flex items-center",
          selectable && "cursor-pointer relative hover:bg-gray-50",
          spotlight && "bg-yellow-100 hover:bg-yellow-200",
          className
        )}
      >
        <div className="px-2 flex flex-col justify-center items-center w-16">
          {showDate && (
            <div className="text-sm">
              {new Date(entry.logDate).toLocaleDateString("en-us", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
          <div className="leading-none">
            {new Date(entry.logDate).toLocaleString("en-us", {
              hour: "numeric",
              minute: "numeric",
              hour12: false,
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col py-1 overflow-hidden">
          {selectable ? (
            <Link
              to={`/${entry.id}`}
              // see https://inclusive-components.design/cards/
              className="truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0 after:z-10"
            >
              {entry.title}
            </Link>
          ) : (
            <div className="truncate leading-[1.2]">{entry.title}</div>
          )}
          <div className="flex items-center h-5">
            <div className="text-sm text-gray-500 leading-none whitespace-nowrap">
              {entry.author}
            </div>
            <TagList tags={entry.tags} />
          </div>
        </div>
        <div className="flex gap-2 pl-3">
          <FloatingDelayGroup delay={200}>
            {allowSpotlight && (
              <RowButton
                tooltip="Spotlight"
                // If the pane is fullscreen, then we want to close it
                // which can be done by redirecting to the root: `/`.
                to={isPaneFullscreen ? `/#${entry.id}` : `#${entry.id}`}
                highlighted={spotlight}
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
                to={`/${entry.id}/supersede`}
                highlighted={spotlight}
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
                to={`/${entry.id}/follow-up`}
                highlighted={spotlight}
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
                  { "rotate-180": expanded },
                  spotlight && "hover:bg-yellow-300"
                )}
                onClick={toggleExpand}
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
            <EntryBody entry={fullEntry} showEmptyLabel />
          </div>
          {showFollowUps && (
            <div className="ml-12 border-l">
              <EntryList
                entries={fullEntry.followUp}
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

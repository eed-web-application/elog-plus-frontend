import cn from "classnames";
import { PropsWithChildren, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { IconButton } from "./base";
import { useEntriesStore } from "../entriesStore";
import { Entry, EntrySummary } from "../api";
import EntryList from "./EntryList";
import Tag from "./Tag";
import EntryBody from "./EntryBody";

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
}: PropsWithChildren<Props>) {
  const [expanded, setExpanded] = useState(Boolean(expandedDefault));
  const [fullEntry, setFullEntry] = useState<Entry | null>(null);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const getOrFetch = useEntriesStore((state) => state.getOrFetch);

  async function toggleExpand(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();

    setFullEntry(await getOrFetch(entry.id));
    setExpanded((expanded) => !expanded);
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isTagsOpen,
    onOpenChange: setIsTagsOpen,
  });

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
              className="truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0"
            >
              {entry.title}
            </Link>
          ) : (
            <div className="truncate leading-[1.2]">{entry.title}</div>
          )}
          <div className="flex items-center h-5">
            <div className="text-sm text-gray-500 leading-none truncate flex-shrink">
              {entry.author}
            </div>
            {entry.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="ml-1.5">
                {tag}
              </Tag>
            ))}
            {entry.tags.length > 2 && (
              <Tag
                ref={refs.setReference}
                {...getReferenceProps()}
                className="ml-1.5 z-0"
                clickable
              >
                ...
              </Tag>
            )}
            {isTagsOpen && (
              <div
                className="shadow rounded-lg bg-white p-1.5 pb-0 mt-1 z-10"
                style={floatingStyles}
                ref={refs.setFloating}
                {...getFloatingProps()}
              >
                {entry.tags.slice(2).map((tag) => (
                  <Tag key={tag} className="mb-1.5">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex">
          {allowSpotlight && (
            <Link
              to={`#${entry.id}`}
              className={cn(IconButton, "p-1 mr-2 z-0")}
              onClick={(e) => e.stopPropagation()}
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
            </Link>
          )}

          {allowSupersede && (
            <Link
              to={`/${entry.id}/supersede`}
              className={cn(IconButton, "rounded-full mr-2 z-0")}
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
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
            </Link>
          )}

          {allowFollowUp && (
            <Link
              to={`/${entry.id}/follow-up`}
              className={cn(IconButton, "p-1 mr-2 rotate-180 z-0")}
              onClick={(e) => e.stopPropagation()}
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
            </Link>
          )}
          {expandable && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              tabIndex={0}
              className={cn(IconButton, "z-0", { "rotate-180": expanded })}
              onClick={toggleExpand}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          )}
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
                allowFollowUp={allowFollowUp}
                allowSupersede={allowSupersede}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

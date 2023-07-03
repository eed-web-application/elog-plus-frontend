import cn from "classnames";
import { PropsWithChildren, useState } from "react";
import { Link } from "react-router-dom";
import { IconButton } from "./base";
import { useEntriesStore } from "../entriesStore";
import { Entry, EntrySummary } from "../api";
import EntryList from "./EntryList";
import Tag from "./Tag";

export interface Props {
  entry: EntrySummary;
  className?: string;
  selectable?: boolean;
  expandable?: boolean;
  showFollowUps?: boolean;
  expandedDefault?: boolean;
  showDate?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
}

export default function EntryRow({
  entry,
  className,
  expandable,
  selectable,
  showFollowUps,
  expandedDefault,
  showDate,
  allowFollowUp,
  allowSupersede,
}: PropsWithChildren<Props>) {
  const [expanded, setExpanded] = useState(Boolean(expandedDefault));
  const [fullEntry, setFullEntry] = useState<Entry | null>(null);

  const { getOrFetch } = useEntriesStore();

  async function toggleExpand(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();

    setFullEntry(await getOrFetch(entry.id));
    setExpanded((expanded) => !expanded);
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center",
          selectable && "cursor-pointer relative hover:bg-gray-50",
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
          <div className="leading-none">{entry.logDate.substring(11, 16)}</div>
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
            <div className="text-sm text-gray-500 leading-none truncate">
              {entry.author}
            </div>
            {entry.tags.map((tag) => (
              <Tag key={tag} className="ml-1.5">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
        <div className="flex">
          {/* Used a container, so the icon doesn't get crop due to rounded-full */}
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
            className={cn("p-2 bg-gray-100", fullEntry.text || "text-gray-500")}
            dangerouslySetInnerHTML={
              fullEntry.text ? { __html: fullEntry.text } : undefined
            }
          >
            {fullEntry.text ? undefined : "No entry text"}
          </div>
          {showFollowUps && (
            <div className="ml-12 border-l">
              <EntryList
                entries={fullEntry.followUp}
                emptyLabel=""
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

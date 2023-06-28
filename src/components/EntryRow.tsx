import cn from "classnames";
import { PropsWithChildren, useState } from "react";
import { IconButton } from "./base";
import { useEntriesStore } from "../entriesStore";
import { EntrySummary } from "../api";

export interface Props {
  entry: EntrySummary;
  className?: string;
  onSelected: (id: string) => void;
  onFollowUp: () => void;
}

export default function EntryRow({
  entry,
  className,
  onSelected,
  onFollowUp,
}: PropsWithChildren<Props>) {
  const [previewing, setPreviewing] = useState(false);
  const [bodyContent, setBodyContent] = useState<string | null>(null);
  const { getOrFetch } = useEntriesStore();

  async function preview(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();
    const fullEntry = await getOrFetch(entry.id);
    setBodyContent(fullEntry.text);
    setPreviewing((previewing) => !previewing);
  }

  function followUp(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();
    onFollowUp();
  }

  return (
    <>
      <div
        tabIndex={0}
        onClick={() => onSelected(entry.id)}
        className={cn("border-b flex cursor-pointer items-center", className)}
      >
        <div className="p-2 flex justify-center items-center w-16">
          {entry.logDate.substring(11, 16)}
        </div>
        <div className="flex-1 flex flex-col py-1 overflow-hidden">
          <div className="truncate leading-[1.2]">{entry.title}</div>
          <div className="flex items-center h-5">
            <div className="text-sm text-gray-500 leading-none ">
              {entry.author}
            </div>
            {entry.tags?.map((tag) => (
              <div className="ml-2 border-gray-400 px-1.5 py-0.5 border text-sm leading-none rounded-full">
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="flex">
          {/* Used a container, so the icon doesn't get crop due to rounded-full */}
          <div className={cn(IconButton, "rounded-full mr-2")} tabIndex={0}>
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
          </div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            tabIndex={0}
            onClick={followUp}
            className={cn(IconButton, "p-1 mr-2 rotate-180")}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            tabIndex={0}
            className={cn(IconButton, { "rotate-180": previewing })}
            onClick={preview}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </div>
      {previewing && (
        <div
          className={cn(
            "p-2 bg-gray-200 preview",
            bodyContent || "text-gray-500"
          )}
          dangerouslySetInnerHTML={
            bodyContent ? { __html: bodyContent } : undefined
          }
        >
          {bodyContent ? undefined : "No body content"}
        </div>
      )}
    </>
  );
}

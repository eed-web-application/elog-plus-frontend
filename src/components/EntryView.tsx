import { twMerge } from "tailwind-merge";
import { Entry } from "../api";
import { Link } from "react-router-dom";
import { Button, IconButton } from "./base";
import EntryList from "./EntryList";
import EntryBodyText from "./EntryBodyText";
import Chip from "./Chip";
import AttachmentCard from "./AttachmentCard";
import EntryRow from "./EntryRow";
import EntryFigureList from "./EntryFigureList";
import TextDivider from "./TextDivider";
import useSpotlightProps from "../hooks/useSpotlightProps";

export interface Props {
  entry: Entry;
}

// Detailed view of an entry with acitons such as supersede and follow up.
export default function EntryView({ entry }: Props) {
  const attachments = entry.attachments.filter(
    (attachment) => attachment.previewState !== "Completed"
  );

  const spotlightProps = useSpotlightProps(entry.id);

  return (
    <>
      <Link
        {...spotlightProps}
        className={twMerge(IconButton, "my-1 float-right")}
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
      <div className={twMerge("px-3 pt-2", !entry.followingUp && "pb-2")}>
        <div className="text-lg -mb-1">{entry.title}</div>
        <div className="text-sm text-gray-500 uppercase">{entry.logbook}</div>
      </div>
      {entry.followingUp && (
        <>
          <TextDivider>Follows up</TextDivider>
          <EntryRow
            containerClassName="mt-1.5 mb-3.5 mx-3 rounded-lg border mb-2 overflow-hidden"
            entry={entry.followingUp}
            showDate
            expandable
            selectable
            allowSpotlight
          />
        </>
      )}
      <div className="flex flex-col gap-1 px-3 py-2 border-t">
        <div>
          <div className="text-gray-500">Logged by </div>
          {entry.loggedBy}
        </div>
        <div>
          <div className="text-gray-500">Logged at</div>
          {entry.loggedAt.toLocaleString("en-us", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
          })}
        </div>
        {entry.eventAt &&
          entry.eventAt.getTime() !== entry.loggedAt.getTime() && (
            <div>
              <div className="text-gray-500">Event occurrend at</div>
              {entry.eventAt.toLocaleString("en-us", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false,
              })}
            </div>
          )}
        {entry.shift && (
          <div>
            <div className="text-gray-500">During</div>
            {entry.shift.name}
          </div>
        )}
        {entry.tags.length > 0 && (
          <div>
            <div className="text-gray-500">Tags</div>
            <div className="flex flex-wrap">
              {entry.tags.map((tag) => (
                <Chip key={tag} className="mr-1.5 mt-0.5">
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
      {(entry.text || entry.attachments.length > 0) && (
        <div className="px-3 py-2 border-t">
          <EntryBodyText body={entry.text} />
          <EntryFigureList attachments={entry.attachments} />
          {attachments.length > 0 && (
            <>
              <div className="mt-1 mb-1 text-gray-500">Attachments</div>
              <div className="w-full overflow-hidden flex flex-wrap m-auto pb-1 gap-3">
                {attachments.map((attachment) => (
                  <AttachmentCard
                    key={attachment.id}
                    attachment={attachment}
                    downloadable
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="text-right px-3 pt-3 pb-2 border-t">
        <Link
          to={{
            pathname: `/${entry.id}/supersede`,
            search: window.location.search,
          }}
          className={twMerge(Button, "mr-3 inline-block ml-auto w-fit")}
        >
          Supersede
        </Link>
        <Link
          to={{
            pathname: `/${entry.id}/follow-up`,
            search: window.location.search,
          }}
          className={twMerge(Button, "inline-block ml-auto w-fit")}
        >
          Follow up
        </Link>
      </div>
      {entry.history && entry.history.length > 0 && (
        <>
          <TextDivider>History</TextDivider>
          <div className="mt-3 px-3 pb-3">
            <EntryList entries={entry.history} showDate expandable selectable />
          </div>
        </>
      )}
      {entry.followUps.length > 0 && (
        <>
          <TextDivider>Follow Ups</TextDivider>
          <div className="mt-3 px-3 pb-3">
            <EntryList
              entries={entry.followUps}
              showDate
              showFollowUps
              expandable
              selectable
              allowSpotlight
            />
          </div>
        </>
      )}
    </>
  );
}

import cn from "classnames";
import { Entry } from "../api";
import { Link } from "react-router-dom";
import { Button } from "./base";
import EntryList from "./EntryList";
import EntryBody from "./EntryBody";
import Tag from "./Tag";
import AttachmentCard from "./AttachmentCard";
import EntryRow from "./EntryRow";
import EntryFigureList from "./EntryFigureList";
import TextDivider from "./TextDivider";

export interface Props {
  entry: Entry;
}

export default function EntryView({ entry }: Props) {
  const attachments = entry.attachments.filter(
    (attachment) => attachment.previewState !== "Completed"
  );

  return (
    <>
      <div
        className={cn(
          "text-lg px-3 flex justify-between items-center",
          !entry.followingUp && "pb-2"
        )}
      >
        {entry.title}
      </div>
      {entry.followingUp && (
        <div className="pb-2">
          <TextDivider>Follows up</TextDivider>
          <div className="px-3">
            <EntryRow
              entry={entry.followingUp}
              showDate
              expandable
              selectable
              allowSpotlight
            />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 px-3 py-2 border-t">
        <div>
          <div className="text-gray-500">Logged by </div>
          {entry.author}
        </div>
        <div>
          <div className="text-gray-500">Logged at </div>
          {new Date(entry.logDate).toLocaleString("en-us", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
          })}
        </div>
        {entry.tags.length > 0 && (
          <div>
            <div className="text-gray-500">Tags</div>
            <div className="flex flex-wrap">
              {entry.tags.map((tag) => (
                <Tag key={tag} className="mr-1.5 mt-0.5">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
      {(entry.text || entry.attachments.length > 0) && (
        <div className="px-3 py-2 border-t">
          <EntryBody body={entry.text} />
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
          className={cn(Button, "mr-3 inline-block ml-auto w-fit")}
        >
          Supersede
        </Link>
        <Link
          to={{
            pathname: `/${entry.id}/follow-up`,
            search: window.location.search,
          }}
          className={cn(Button, "inline-block ml-auto w-fit")}
        >
          Follow up
        </Link>
      </div>
      {entry.history && entry.history.length > 0 && (
        <>
          <TextDivider>History</TextDivider>
          <div className="px-3 pb-3">
            <EntryList
              entries={entry.history}
              showEntryDates
              expandable
              selectable
            />
          </div>
        </>
      )}
      {entry.followUp.length > 0 && (
        <>
          <TextDivider>Follow Ups</TextDivider>
          <div className="px-3 pb-3">
            <EntryList
              entries={entry.followUp}
              showEntryDates
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

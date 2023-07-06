import cn from "classnames";
import { Entry } from "../api";
import { Link } from "react-router-dom";
import { Button } from "./base";
import EntryList from "./EntryList";
import EntryBody from "./EntryBody";
import Tag from "./Tag";

export interface Props {
  entry: Entry;
}

export default function EntryView({ entry }: Props) {
  return (
    <>
      <div className="p-3 pt-2">
        <div className="text-gray-500">Logged by </div>
        <div className="border-b pb-1 mb-1">{entry.author}</div>
        <div className="text-gray-500">Logged at</div>
        <div className="border-b pb-1 mb-1">
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
          <>
            <div className="text-gray-500">Tags</div>
            <div className="flex border-b pt-1 pb-2 mb-1">
              {entry.tags.map((tag) => (
                <Tag key={tag} className="mr-1.5">
                  {tag}
                </Tag>
              ))}
            </div>
          </>
        )}
        <EntryBody entry={entry} />
        <div className="text-right border-t mt-1 pt-3">
          <Link
            to={`/${entry.id}/supersede`}
            className={cn(Button, "mr-3 inline-block ml-auto w-fit")}
          >
            Supersede
          </Link>
          <Link
            to={`/${entry.id}/follow-up`}
            className={cn(Button, "mr-3 inline-block ml-auto w-fit")}
          >
            Follow up
          </Link>
        </div>
      </div>
      {entry.followUp.length > 0 && (
        <div className="p-3 border-t">
          <div className="text-gray-500">Follow ups</div>
          <EntryList
            entries={entry.followUp}
            emptyLabel="No follow ups"
            showEntryDates
            expandable
          />
        </div>
      )}
    </>
  );
}

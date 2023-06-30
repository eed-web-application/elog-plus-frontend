import { useEffect, useState } from "react";
import cn from "classnames";
import { Entry, EntrySummary, fetchFollowUps } from "../api";
import { Link } from "react-router-dom";
import { Button } from "./base";
import EntryList from "./EntryList";

export interface Props {
  entry: Entry;
}

export default function EntryView({ entry }: Props) {
  const [followUps, setFollowUps] = useState<{
    [id: string]: EntrySummary[] | null;
  }>({});

  useEffect(() => {
    setFollowUps((followUps) => ({ ...followUps, [entry.id]: null }));

    fetchFollowUps(entry.id).then((entryFollowUps) => {
      setFollowUps((followUps) => ({
        ...followUps,
        [entry.id]: entryFollowUps,
      }));
    });
  }, [entry]);

  return (
    <>
      <div
        className={cn("p-3 pt-2", entry.text || "text-gray-500")}
        dangerouslySetInnerHTML={
          entry.text ? { __html: entry.text } : undefined
        }
      >
        {entry.text ? undefined : "No entry text"}
      </div>
      <Link
        to={`/${entry.id}/follow-up`}
        className={cn(Button, "mb-3 mr-3 block ml-auto w-fit")}
      >
        Follow up
      </Link>
      <div className="px-3 border-t pt-3">
        <EntryList
          entries={followUps[entry.id] || []}
          isLoading={!followUps[entry.id]}
          emptyLabel="No follow ups"
          showEntryDates
          expandable
        />
      </div>
    </>
  );
}

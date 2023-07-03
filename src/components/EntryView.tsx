import cn from "classnames";
import { Entry } from "../api";
import { Link } from "react-router-dom";
import { Button } from "./base";
import EntryList from "./EntryList";
import EntryBody from "./EntryBody";

export interface Props {
  entry: Entry;
}

export default function EntryView({ entry }: Props) {
  return (
    <>
      <div className={"p-3 pt-2"}>
        <EntryBody entry={entry} />
      </div>
      <Link
        to={`/${entry.id}/follow-up`}
        className={cn(Button, "mb-3 mr-3 block ml-auto w-fit")}
      >
        Follow up
      </Link>
      <div className="px-3 border-t pt-3">
        <EntryList
          entries={entry.followUp}
          emptyLabel="No follow ups"
          showEntryDates
          expandable
        />
      </div>
    </>
  );
}

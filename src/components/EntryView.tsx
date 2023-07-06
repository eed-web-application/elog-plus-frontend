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
      <div className="text-right">
        <Link
          to={`/${entry.id}/supersede`}
          className={cn(Button, "mb-3 mr-3 inline-block ml-auto w-fit")}
        >
          Supersede
        </Link>
        <Link
          to={`/${entry.id}/follow-up`}
          className={cn(Button, "mb-3 mr-3 inline-block ml-auto w-fit")}
        >
          Follow up
        </Link>
      </div>
      <div className="p-3 border-t">
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

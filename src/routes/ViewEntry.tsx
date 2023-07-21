import { useLoaderData } from "react-router-dom";
import Pane from "../components/Pane";
import { Entry } from "../api";
import EntryView from "../components/EntryView";

export default function ViewEntry() {
  const entry = useLoaderData() as Entry;

  return (
    <Pane explicitHeader={false}>
      <EntryView entry={entry} />
    </Pane>
  );
}

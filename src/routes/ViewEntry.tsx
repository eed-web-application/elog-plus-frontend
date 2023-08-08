import { useParams } from "react-router-dom";
import Pane from "../components/Pane";
import EntryView from "../components/EntryView";
import useEntry from "../hooks/useEntry";

export default function ViewEntry() {
  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return;
  }

  return (
    <Pane>
      <EntryView entry={entry} />
    </Pane>
  );
}

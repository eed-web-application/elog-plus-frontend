import { useParams } from "react-router-dom";
import EntryView from "../components/EntryView";
import useEntry from "../hooks/useEntry";

export default function ViewEntry() {
  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return;
  }

  return <EntryView entry={entry} />;
}

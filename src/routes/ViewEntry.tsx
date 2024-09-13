import { useParams } from "react-router-dom";
import EntryView from "../components/EntryView";
import useEntry from "../hooks/useEntry";
import Spinner from "../components/Spinner";

export default function ViewEntry() {
  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return <Spinner size="large" className="mx-auto my-4 w-full" />;
  }

  return <EntryView entry={entry} />;
}

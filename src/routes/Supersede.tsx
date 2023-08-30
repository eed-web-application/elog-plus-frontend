import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EntryForm from "../components/EntryForm";
import useEntry from "../hooks/useEntry";

export default function Supersede() {
  const navigate = useNavigate();

  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return;
  }

  return (
    <EntryForm
      kind={["superseding", entry]}
      onEntrySaved={(entryId) => {
        toast.success("Superseded entry");
        navigate({ pathname: `/${entryId}`, search: window.location.search });
      }}
    />
  );
}

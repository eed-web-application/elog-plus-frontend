import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EntryForm from "../components/EntryForm";
import useEntry from "../hooks/useEntry";
import Spinner from "../components/Spinner";

export default function Supersede() {
  const navigate = useNavigate();

  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return <Spinner size="large" className="mx-auto my-4 w-full" />;
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

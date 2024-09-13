import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EntryForm from "../components/EntryForm";
import useEntry from "../hooks/useEntry";
import Spinner from "../components/Spinner";

export default function FollowUp() {
  const navigate = useNavigate();

  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return <Spinner size="large" className="mx-auto my-4 w-full" />;
  }

  return (
    <EntryForm
      kind={["followingUp", entry]}
      onEntrySaved={(entryId) => {
        toast.success("Followed up entry");
        navigate({ pathname: `/${entryId}`, search: window.location.search });
      }}
    />
  );
}

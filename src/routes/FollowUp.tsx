import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import useEntry from "../hooks/useEntry";

export default function FollowUp() {
  const navigate = useNavigate();

  const { entryId } = useParams();
  const entry = useEntry(entryId);

  if (!entry) {
    return;
  }

  return (
    <Pane>
      <EntryForm
        kind={["followingUp", entry]}
        onEntrySaved={(entryId) => {
          toast.success("Followed up entry");
          navigate({ pathname: `/${entryId}`, search: window.location.search });
        }}
      />
    </Pane>
  );
}

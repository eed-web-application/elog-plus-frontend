import { useLoaderData, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import { Entry } from "../api";
import { useEntriesStore } from "../entriesStore";

export default function FollowUp() {
  const navigate = useNavigate();
  const invalidateEntry = useEntriesStore((state) => state.invalidate);

  const entry = useLoaderData() as Entry;

  return (
    <Pane>
      <EntryForm
        kind={["followingUp", entry]}
        onEntryCreated={(entryId) => {
          invalidateEntry(entry.id);
          navigate({ pathname: `/${entryId}`, search: window.location.search });
        }}
      />
    </Pane>
  );
}

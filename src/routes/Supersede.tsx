import { useLoaderData, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import { Entry } from "../api";
import { useEntriesStore } from "../entriesStore";
import { toast } from "react-toastify";

export default function Supersede() {
  const navigate = useNavigate();
  const invalidateEntry = useEntriesStore((state) => state.invalidate);

  const entry = useLoaderData() as Entry;

  return (
    <Pane>
      <EntryForm
        kind={["superseding", entry]}
        onEntryCreated={(entryId) => {
          toast.success("Superseded entry");
          invalidateEntry(entry.id);
          navigate({ pathname: `/${entryId}`, search: window.location.search });
        }}
      />
    </Pane>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import { useDraftsStore } from "../draftsStore";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function NewEntry() {
  const { state: customDraftProperties } = useLocation();
  const upsertDraft = useDraftsStore((state) => state.upsertDraft);

  useEffect(() => {
    if (customDraftProperties) {
      upsertDraft("newEntry", customDraftProperties);
    }
  }, [upsertDraft, customDraftProperties]);

  const navigate = useNavigate();

  return (
    <Pane>
      <EntryForm
        kind="newEntry"
        onEntryCreated={(entryId) => {
          toast.success("Created entry", { autoClose: 1000 });
          navigate({ pathname: `/${entryId}`, search: window.location.search });
        }}
      />
    </Pane>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import { DEFAULT_DRAFT, useDraftsStore } from "../draftsStore";
import { useEffect } from "react";

export default function NewEntry() {
  const { state: customDraftProperties } = useLocation();
  const updateNewEntryDraft = useDraftsStore(
    (state) => state.updateNewEntryDraft
  );

  useEffect(() => {
    if (customDraftProperties) {
      updateNewEntryDraft({
        ...(useDraftsStore.getState().newEntry || DEFAULT_DRAFT),
        ...customDraftProperties,
      });
    }
  }, [updateNewEntryDraft, customDraftProperties]);

  const navigate = useNavigate();

  return (
    <Pane explicitHeader={false}>
      <div className="text-lg pl-3 pt-2 mb-2">New entry</div>
      <div className="w-full border-b mb-2" />
      <EntryForm
        onEntryCreated={(entryId) =>
          navigate({ pathname: `/${entryId}`, search: window.location.search })
        }
      />
    </Pane>
  );
}

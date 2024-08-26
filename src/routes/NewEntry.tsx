import { useLocation, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import { useDraftsStore } from "../draftsStore";
import { useEffect } from "react";
import { toast } from "react-toastify";
import useEntryQuery from "../hooks/useEntryQuery";
import useLogbooks from "../hooks/useLogbooks";

export default function NewEntry() {
  const { state: customDraftProperties } = useLocation();
  const upsertDraft = useDraftsStore((state) => state.upsertDraft);
  const [query, _] = useEntryQuery();
  const { logbookNameMap, isLoading: isLogbooksLoading } = useLogbooks({
    critical: false,
    requirePermission: "Write",
  });

  const logbooks = query.logbooks
    .map((name) => logbookNameMap[name.toLowerCase()]?.id)
    .filter(Boolean);

  useEffect(() => {
    if (customDraftProperties) {
      upsertDraft("newEntry", customDraftProperties);
    }
  }, [upsertDraft, customDraftProperties]);

  const navigate = useNavigate();

  if (isLogbooksLoading) {
    return null;
  }

  return (
    <EntryForm
      kind={["newEntry", logbooks]}
      onEntrySaved={(entryId) => {
        toast.success("Created entry", { autoClose: 1000 });
        navigate({ pathname: `/${entryId}`, search: window.location.search });
      }}
    />
  );
}

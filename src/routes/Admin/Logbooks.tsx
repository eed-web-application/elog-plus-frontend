import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import LogbookForm from "../../components/admin/LogbookForm";
import { useLogbookFormsStore } from "../../logbookFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminResource from "../../components/admin/Resource";
import NewLogbookDialog from "../../components/admin/NewLogbookDialog";

export default function AdminLogbooks() {
  const [logbookSearch, setLogbookSearch] = useState("");
  const {
    logbookMap,
    logbooks,
    isLoading: isLogbooksLoading,
  } = useLogbooks({ requireWrite: true, includeAuth: true });
  const { logbookId: selectedLogbookId } = useParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const selectedLogbook = selectedLogbookId
    ? logbookMap[selectedLogbookId]
    : undefined;

  const logbooksEdited = useLogbookFormsStore((state) =>
    Object.keys(state.forms),
  );

  const onSave = useCallback(() => {
    toast.success("Saved logbook");
  }, []);

  const logbooksSearched = logbooks.filter((logbook) =>
    logbook.name.toLowerCase().includes(logbookSearch.toLowerCase()),
  );

  return (
    <NewLogbookDialog isOpen={isCreateOpen} setIsOpen={setIsCreateOpen}>
      <AdminResource
        home="/admin/logbooks"
        items={logbooksSearched.map((logbook) => ({
          label: logbook.name,
          link: `/admin/logbooks/${logbook.id}`,
          edited: logbooksEdited.includes(logbook.id),
        }))}
        isLoading={isLogbooksLoading}
        createLabel="Create logbook"
        onCreate={() => setIsCreateOpen(true)}
        onSearchChange={setLogbookSearch}
      >
        {selectedLogbook && (
          <LogbookForm logbook={selectedLogbook} onSave={onSave} />
        )}
      </AdminResource>
    </NewLogbookDialog>
  );
}

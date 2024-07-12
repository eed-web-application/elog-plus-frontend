import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { twJoin } from "tailwind-merge";
import LogbookForm from "../../components/LogbookForm";
import { useLogbookFormsStore } from "../../logbookFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import Dialog from "../../components/Dialog";
import { createLogbook } from "../../api";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";
import AdminResource from "../../components/AdminResource";

export default function AdminLogbooks() {
  const {
    logbookMap,
    logbooks,
    isLoading: isLogbooksLoading,
  } = useLogbooks({ requireWrite: true, includeAuth: true });
  const { logbookId: selectedLogbookId } = useParams();
  // null means dialog not open
  const [newLogbookName, setNewLogbookName] = useState<string | null>(null);

  const selectedLogbook = selectedLogbookId
    ? logbookMap[selectedLogbookId]
    : undefined;

  const logbooksEdited = useLogbookFormsStore((state) =>
    Object.keys(state.forms),
  );

  const onSave = useCallback(() => {
    toast.success("Saved logbook");
  }, []);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saveLogbook = useCallback(async () => {
    if (!newLogbookName) {
      return;
    }

    const logbookId = await createLogbook(newLogbookName);
    navigate(`/admin/logbooks/${logbookId}`);
    setNewLogbookName(null);
    queryClient.invalidateQueries({ queryKey: ["logbooks"] });
  }, [newLogbookName, navigate, queryClient]);

  return (
    <Dialog controlled isOpen={newLogbookName !== null}>
      <AdminResource
        home="/admin/logbooks"
        items={logbooks.map((logbook) => ({
          label: logbook.name,
          link: `/admin/logbooks/${logbook.id}`,
          edited: logbooksEdited.includes(logbook.id),
        }))}
        isLoading={isLogbooksLoading}
        createLabel="Create logbook"
        onCreate={() => setNewLogbookName("")}
      >
        {selectedLogbook && (
          <LogbookForm logbook={selectedLogbook} onSave={onSave} />
        )}
      </AdminResource>
      <Dialog.Content
        as="form"
        className="w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          saveLogbook();
        }}
      >
        <Dialog.Section>
          <h1 className="text-lg">New logbook</h1>
        </Dialog.Section>
        <Dialog.Section>
          <label className="block mb-2 text-gray-500">
            Name
            <input
              required
              value={newLogbookName || ""}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setNewLogbookName(e.target.value)}
            />
          </label>
        </Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
          <button
            type="button"
            className={TextButton}
            onClick={() => setNewLogbookName(null)}
          >
            Cancel
          </button>
          <input
            value="Save"
            type="submit"
            className={Button}
            disabled={!newLogbookName}
          />
        </Dialog.Section>
      </Dialog.Content>
    </Dialog>
  );
}

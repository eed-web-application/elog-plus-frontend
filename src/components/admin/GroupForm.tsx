import { twJoin } from "tailwind-merge";
import { GroupWithAuth, Logbook, Permission } from "../../api";
import { Button } from "../base";
import { useGroupFormsStore } from "../../groupFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import { useState } from "react";
import useGroup from "../../hooks/useGroup";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";

export type Props = {
  onSave: () => void;
  groupId: string;
};

const DEFAULT_PERMISSION: Permission = "Read";

function GroupFormInner({
  group,
  logbooks,
  isLogbooksLoading,
  onSave,
}: {
  group: GroupWithAuth;
  logbooks: Logbook[];
  isLogbooksLoading: boolean;
  onSave: () => void;
}) {
  const [logbookSearch, setLogbookSearch] = useState("");
  const { form, setForm, finishEditing } = useGroupFormsStore((state) =>
    state.startEditing(group),
  );
  const queryClient = useQueryClient();

  async function save() {
    await saveAuthorizations(group.authorizations, form.authorizations);
    await queryClient.invalidateQueries({ queryKey: ["group", group.id] });

    finishEditing();
    onSave();
  }

  function updateAuthorizationPermission(
    resourceId: string,
    permission: Permission,
  ) {
    setForm({
      ...form,
      authorizations: form.authorizations.map((otherAuthorization) =>
        otherAuthorization.resourceId === resourceId
          ? { ...otherAuthorization, permission }
          : otherAuthorization,
      ),
    });
  }

  function removeAuthorization(resourceId: string) {
    setForm({
      ...form,
      authorizations: form.authorizations.filter(
        (otherAuthorization) => otherAuthorization.resourceId !== resourceId,
      ),
    });
  }

  function createAuthorization(resourceId: string) {
    const resouceLabel = logbooks.find(
      (logbook) => logbook.id === resourceId,
    )?.name;

    // Should probably never happen, but we still want to catch it, because
    // if this throws something else is wrong.
    if (!resouceLabel) {
      throw new Error("Could not find label for new authorization");
    }

    // If the user deletes an authorization and then creates a new one with the
    // same owner, we want to keep the ID so we don't create a new one.
    const existingAuthorization = group.authorizations.find(
      (authorization) => authorization.resourceId === resourceId,
    );

    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          id: existingAuthorization?.id,
          permission: DEFAULT_PERMISSION,
          ownerId: group.id,
          ownerType: "Group",
          ownerName: group.name,
          resourceId,
          resourceType: "Logbook",
          resourceName: resouceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) === JSON.stringify(group);

  const logbooksFiltered = logbooks
    .filter((logbook) =>
      logbook.name.toLowerCase().includes(logbookSearch.toLowerCase()),
    )
    .filter(
      (logbook) =>
        !form.authorizations.some((auth) => auth.resourceId === logbook.id),
    );

  return (
    <div className="p-3">
      <div className="text-gray-500">Logbook Authorizations</div>
      <AdminAuthorizationForm
        emptyLabel="No logbook authorizations. Create one below."
        options={logbooksFiltered.map((logbook) => ({
          label: logbook.name,
          value: logbook.id,
        }))}
        isOptionsLoading={isLogbooksLoading}
        authorizations={form.authorizations
          .filter((auth) => auth.resourceType === "Logbook")
          .map((auth) => ({
            value: auth.resourceId,
            label: auth.resourceName,
            permission: auth.permission,
          }))}
        setOptionsSearch={setLogbookSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={createAuthorization}
      />
      <button
        disabled={updated}
        className={twJoin(Button, "block ml-auto mt-3")}
        onClick={save}
      >
        Save
      </button>
    </div>
  );
}

export default function GroupForm({ groupId, onSave }: Props) {
  const { logbooks, isLoading: isLogbooksLoading } = useLogbooks();
  const group = useGroup(groupId, { includeAuthorizations: true });

  if (!group) {
    return <Spinner className="mt-3 w-full" />;
  }

  return (
    <GroupFormInner
      group={group}
      logbooks={logbooks}
      isLogbooksLoading={isLogbooksLoading}
      onSave={onSave}
    />
  );
}

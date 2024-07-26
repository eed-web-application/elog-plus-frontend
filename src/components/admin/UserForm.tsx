import { twJoin } from "tailwind-merge";
import { UserWithAuth, Permission, Logbook } from "../../api";
import { Button, TextButton } from "../base";
import { useUserFormsStore } from "../../userFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import { useState } from "react";
import useUser from "../../hooks/useUser";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  userId: string;
  onSave: () => void;
}

const DEFAULT_PERMISSION: Permission = "Read";

function UserFormInner({
  user,
  logbooks,
  isLogbooksLoading,
  onSave,
}: {
  user: UserWithAuth;
  logbooks: Logbook[];
  isLogbooksLoading: boolean;
  onSave: () => void;
}) {
  const [logbookSearch, setLogbookSearch] = useState("");
  const { form, setForm, finishEditing } = useUserFormsStore((state) =>
    state.startEditing(user),
  );
  const queryClient = useQueryClient();

  async function save() {
    await saveAuthorizations(user.authorizations, form.authorizations);
    await queryClient.invalidateQueries({ queryKey: ["user", user.id] });

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
    const existingAuthorization = user.authorizations.find(
      (authorization) => authorization.resourceId === resourceId,
    );

    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          id: existingAuthorization?.id,
          permission: DEFAULT_PERMISSION,
          ownerId: user.id,
          ownerType: "User",
          ownerName: user.name,
          resourceId,
          resourceType: "Logbook",
          resourceName: resouceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) !== JSON.stringify(user);

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
      <div className="flex justify-end mt-3 gap-3">
        <button
          disabled={!updated}
          className={twJoin(TextButton, "block")}
          onClick={finishEditing}
        >
          Discard changes
        </button>
        <button
          disabled={!updated}
          className={twJoin(Button, "block")}
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function UserForm({ userId, onSave }: Props) {
  const { logbooks, isLoading } = useLogbooks();
  const user = useUser(userId, { includeAuthorizations: true });

  if (!user) {
    return <Spinner className="mt-3 w-full" />;
  }

  return (
    <UserFormInner
      user={user}
      logbooks={logbooks}
      isLogbooksLoading={isLoading}
      onSave={onSave}
    />
  );
}

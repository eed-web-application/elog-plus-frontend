import { twJoin } from "tailwind-merge";
import { UserWithAuth, Permission } from "../api";
import { Button } from "./base";
import { useUserFormsStore } from "../userFormsStore";
import useLogbooks from "../hooks/useLogbooks";
import AdminAuthorizationForm from "./AdminAuthorizationForm";
import { saveAuthorizations } from "../authorizationDiffing";
import { useState } from "react";

interface Props {
  user: UserWithAuth;
  onSave: () => void;
}

const DEFAULT_PERMISSION: Permission = "Read";

export default function UserForm({ user, onSave }: Props) {
  const { logbooks, isLoading } = useLogbooks();
  const [logbookSearch, setLogbookSearch] = useState("");
  const { form, setForm, finishEditing } = useUserFormsStore((state) =>
    state.startEditing(user),
  );

  async function save() {
    await saveAuthorizations(user.authorizations, form.authorizations);

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
          ownerLabel: user.name,
          resourceId,
          resourceType: "Logbook",
          resouceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) === JSON.stringify(user);

  const logbooksSearched = logbooks.filter((logbook) =>
    logbook.name.toLowerCase().includes(logbookSearch.toLowerCase()),
  );

  return (
    <div className="px-3 pb-3">
      <div className="text-gray-500">Logbook Authorizations</div>
      <AdminAuthorizationForm
        emptyLabel="No logbook authorizations. Create one below."
        options={logbooksSearched.map((logbook) => ({
          label: logbook.name,
          value: logbook.id,
        }))}
        isOptionsLoading={isLoading}
        authorizations={form.authorizations
          .filter((auth) => auth.resourceType === "Logbook")
          .map((auth) => ({
            value: auth.resourceId,
            label: auth.resouceLabel,
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

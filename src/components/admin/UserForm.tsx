import { twJoin, twMerge } from "tailwind-merge";
import { UserWithAuth, Permission, Logbook, ServerError } from "../../api";
import { Button, Input, TextButton } from "../base";
import { useUserFormsStore } from "../../userFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import useUser from "../../hooks/useUser";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import reportServerError from "../../reportServerError";

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
  const { form, setForm, finishEditing } = useUserFormsStore((state) =>
    state.startEditing(user),
  );
  const queryClient = useQueryClient();

  async function save() {
    try {
      await saveAuthorizations(user.authorizations, form.authorizations);
    } catch (e) {
      if (e instanceof ServerError) {
        reportServerError("Could not save user", e);
        return;
      }

      throw e;
    }
    await queryClient.invalidateQueries({ queryKey: ["user", user.email] });

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

  function createAuthorization(resourceId: string, resourceLabel: string) {
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
          ownerId: user.email,
          ownerType: "User",
          ownerName: user.gecos,
          resourceId,
          resourceType: "Logbook",
          resourceName: resourceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) !== JSON.stringify(user);

  const logbooksFiltered = logbooks.filter(
    (logbook) =>
      !form.authorizations.some((auth) => auth.resourceId === logbook.id),
  );

  return (
    <div className="p-3 pt-5">
      <label className="block text-gray-500">
        Name
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.gecos}
        />
      </label>

      <label className="block text-gray-500 mt-2">
        Email
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.email}
        />
      </label>

      <div className="text-gray-500 mt-2">Logbook Authorizations</div>
      <AdminAuthorizationForm
        emptyLabel="No logbook authorizations. Create one below."
        options={logbooksFiltered.map((logbook) => ({
          label: logbook.name.toUpperCase(),
          value: logbook.id,
        }))}
        isOptionsLoading={isLogbooksLoading}
        authorizations={form.authorizations
          .filter((auth) => auth.resourceType === "Logbook")
          .map((auth) => ({
            value: auth.resourceId,
            label: auth.resourceName.toUpperCase(),
            permission: auth.permission,
          }))}
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

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { UserWithAuth, Logbook, ServerError } from "../../api";
import { Input } from "../base";
import { useUserFormsStore } from "../../userFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import useUser from "../../hooks/useUser";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import reportServerError from "../../reportServerError";
import Button from "../Button";

interface Props {
  userId: string;
  onSave: () => void;
}

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
  const {
    form,
    updated,
    createAuthorization,
    removeAuthorization,
    updateAuthorization,
    finishEditing,
  } = useUserFormsStore((state) => state.startEditing(user));
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
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
    setSaving(false);
    onSave();
  }

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
        updatePermission={(resourceId, permission) =>
          updateAuthorization({ resourceId }, permission)
        }
        removeAuthorization={(resourceId) =>
          removeAuthorization({ resourceId })
        }
        createAuthorization={(resourceId, resourceName) =>
          createAuthorization({
            ownerId: user.email,
            ownerType: "User",
            ownerName: user.gecos,
            resourceId,
            resourceType: "Logbook",
            resourceName,
          })
        }
      />
      <div className="flex justify-end mt-3 gap-3">
        <Button variant="text" disabled={!updated} onClick={finishEditing}>
          Discard changes
        </Button>
        <Button disabled={!updated} onClick={save} isLoading={saving}>
          Save
        </Button>
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

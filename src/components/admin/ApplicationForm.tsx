import { twJoin } from "tailwind-merge";
import { ApplicationWithAuth, Logbook, Permission } from "../../api";
import { Button, TextButton } from "../base";
import { useApplicationFormsStore } from "../../applicationFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import useApplication from "../../hooks/useApplication";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  applicationId: string;
  onSave: () => void;
}

const DEFAULT_PERMISSION: Permission = "Read";

function ApplicationFormInner({
  application,
  logbooks,
  isLogbooksLoading,
  onSave,
}: {
  application: ApplicationWithAuth;
  logbooks: Logbook[];
  isLogbooksLoading: boolean;
  onSave: () => void;
}) {
  const { form, setForm, finishEditing } = useApplicationFormsStore((state) =>
    state.startEditing(application),
  );
  const queryClient = useQueryClient();

  async function save() {
    await saveAuthorizations(application.authorizations, form.authorizations);
    await queryClient.invalidateQueries({
      queryKey: ["application", application.id],
    });

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
    const existingAuthorization = application.authorizations.find(
      (authorization) => authorization.resourceId === resourceId,
    );

    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          id: existingAuthorization?.id,
          permission: DEFAULT_PERMISSION,
          ownerId: application.id,
          ownerType: "Token",
          ownerName: application.name,
          resourceId,
          resourceType: "Logbook",
          resourceName: resouceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) !== JSON.stringify(application);

  const logbooksFiltered = logbooks.filter(
    (logbook) =>
      !form.authorizations.some((auth) => auth.resourceId === logbook.id),
  );

  return (
    <div className="p-3 pt-5">
      <div className="text-gray-500">Logbook Authorizations</div>
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

export default function ApplicationForm({ applicationId, onSave }: Props) {
  const { logbooks, isLoading } = useLogbooks();
  const application = useApplication(applicationId, {
    includeAuthorizations: true,
  });

  if (!application) {
    return <Spinner className="mt-3 w-full" />;
  }

  return (
    <ApplicationFormInner
      application={application}
      logbooks={logbooks}
      isLogbooksLoading={isLoading}
      onSave={onSave}
    />
  );
}

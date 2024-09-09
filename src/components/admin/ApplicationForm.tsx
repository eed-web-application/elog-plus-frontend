import { twMerge } from "tailwind-merge";
import {
  ApplicationWithAuth,
  Logbook,
  Permission,
  ServerError,
} from "../../api";
import { Input } from "../base";
import { useApplicationFormsStore } from "../../applicationFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import useApplication from "../../hooks/useApplication";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import reportServerError from "../../reportServerError";
import Button from "../Button";

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
    try {
      await saveAuthorizations(application.authorizations, form.authorizations);
    } catch (e) {
      if (e instanceof ServerError) {
        reportServerError("Could not save application", e);
        return;
      }

      throw e;
    }

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
      <label className="block text-gray-500">
        Name
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.name}
        />
      </label>

      <label className="block text-gray-500 mt-2">
        Expiration
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.expiration}
        />
      </label>

      <label className="block text-gray-500 mt-2">
        Token
        <div className="relative">
          <input
            readOnly
            type="text"
            className={twMerge(Input, "block w-full pr-8")}
            value={form.token}
            onFocus={(e) => {
              e.currentTarget.select();
            }}
            onClick={(e) => {
              e.currentTarget.select();
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(form.token);
              toast.success("Copied token", { autoClose: 750 });
            }}
            className="w-6 h-6 absolute right-2 top-2/4 -translate-y-2/4 cursor-pointer hover:text-gray-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
            />
          </svg>
        </div>
      </label>

      <div className="text-gray-500 mt-2">Logbook Authorizations</div>
      <AdminAuthorizationForm
        disabled={application.applicationManaged}
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
      {!application.applicationManaged && (
        <div className="flex justify-end mt-3 gap-3">
          <Button
            variant="text"
            disabled={!updated}
            className="block"
            onClick={finishEditing}
          >
            Discard changes
          </Button>
          {/* FIXME: Shouldn't need block here */}
          <Button disabled={!updated} className="block" onClick={save}>
            Save
          </Button>
        </div>
      )}
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

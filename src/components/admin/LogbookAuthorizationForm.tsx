import AdminAuthorizationForm from "./AuthorizationForm";
import {
  AdminFormsState,
  AdminResource,
  LocalAuthorization,
} from "../../createAdminFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import { Authorization } from "../../api";

type StartEditingReturn<T extends AdminResource> = ReturnType<
  AdminFormsState<T>["startEditing"]
>;

export type Props<T extends AdminResource> = {
  disabled?: boolean;
  ownerId: string;
  ownerType: Authorization["ownerType"];
  ownerName: string;
  authorizations: LocalAuthorization[];
  updateAuthorization: StartEditingReturn<T>["updateAuthorization"];
  removeAuthorization: StartEditingReturn<T>["removeAuthorization"];
  createAuthorization: StartEditingReturn<T>["createAuthorization"];
};

export default function LogbookAuthorizationForm<T extends AdminResource>({
  disabled,
  ownerId,
  ownerType,
  ownerName,
  authorizations,
  updateAuthorization,
  removeAuthorization,
  createAuthorization,
}: Props<T>) {
  const { logbooks, isLoading } = useLogbooks();

  const logbooksFiltered = logbooks.filter(
    (logbook) => !authorizations.some((auth) => auth.resourceId === logbook.id),
  );

  return (
    <AdminAuthorizationForm
      disabled={disabled}
      emptyLabel="No logbook authorizations. Create one below."
      options={logbooksFiltered.map((logbook) => ({
        label: logbook.name.toUpperCase(),
        value: logbook.id,
      }))}
      isOptionsLoading={isLoading}
      authorizations={authorizations
        .filter((auth) => auth.resourceType === "Logbook")
        .map((auth) => ({
          value: auth.resourceId,
          label: auth.resourceName.toUpperCase(),
          permission: auth.permission,
        }))}
      updatePermission={(resourceId, permission) =>
        updateAuthorization({ resourceId }, permission)
      }
      removeAuthorization={(resourceId) => removeAuthorization({ resourceId })}
      createAuthorization={(resourceId, resourceName) =>
        createAuthorization({
          ownerId,
          ownerType,
          ownerName,
          resourceId,
          resourceType: "Logbook",
          resourceName,
        })
      }
    />
  );
}

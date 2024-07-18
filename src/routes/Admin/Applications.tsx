import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import ApplicationForm from "../../components/ApplicationForm";
import useApplications from "../../hooks/useApplications";
import { useApplicationFormsStore } from "../../applicationFormsStore";
import AdminResource from "../../components/AdminResource";

export default function AdminApplications() {
  const [applicationSearch, setApplicationSearch] = useState("");

  const { applications, applicationMap, isLoading } = useApplications({
    search: applicationSearch,
    includeAuthorizations: true,
  });
  const { applicationId: selectedApplicationId } = useParams();

  const selectedApplication = selectedApplicationId
    ? applicationMap[selectedApplicationId]
    : undefined;

  const applicationsEdited = useApplicationFormsStore((state) =>
    Object.keys(state.forms),
  );

  const onSave = useCallback(() => {
    toast.success("Saved application");
  }, []);

  return (
    <>
      <AdminResource
        home="/admin/applications"
        items={applications.map((application) => ({
          label: application.name,
          link: `/admin/applications/${application.id}`,
          edited: applicationsEdited.includes(application.id),
        }))}
        isLoading={isLoading}
        createLabel="Create application"
        onSearchChange={setApplicationSearch}
      >
        {selectedApplication && (
          <ApplicationForm application={selectedApplication} onSave={onSave} />
        )}
      </AdminResource>
    </>
  );
}

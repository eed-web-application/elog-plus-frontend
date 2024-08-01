import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import ApplicationForm from "../../components/admin/ApplicationForm";
import useApplications from "../../hooks/useApplications";
import { useApplicationFormsStore } from "../../applicationFormsStore";
import AdminResource from "../../components/admin/Resource";
import NewApplicationDialog from "../../components/admin/NewApplicationDialog";
import useDebounce from "../../hooks/useDebounce";

export default function AdminApplications() {
  const [applicationSearch, setApplicationSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { applications, isLoading, getMoreApplications } = useApplications({
    search: applicationSearch,
  });
  const { applicationId: selectedApplicationId } = useParams();

  const applicationsEdited = useApplicationFormsStore((state) =>
    Object.keys(state.forms),
  );

  const onSave = useCallback(() => {
    toast.success("Saved application");
  }, []);

  const onSearchChange = useDebounce(setApplicationSearch, 500);

  return (
    <NewApplicationDialog
      isOpen={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
    >
      <AdminResource
        home="/admin/applications"
        items={applications.map((application) => ({
          label: application.name,
          link: `/admin/applications/${application.id}`,
          edited: applicationsEdited.includes(application.id),
          readOnly: application.applicationManaged,
        }))}
        isLoading={isLoading}
        createLabel="Create application"
        onCreate={() => setIsCreateOpen(true)}
        onSearchChange={onSearchChange}
        onBottomVisible={getMoreApplications}
      >
        {selectedApplicationId && (
          <ApplicationForm
            applicationId={selectedApplicationId}
            onSave={onSave}
          />
        )}
      </AdminResource>
    </NewApplicationDialog>
  );
}

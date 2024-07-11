import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  Link,
  useNavigate,
  useParams,
  Outlet,
  useOutlet,
} from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";
import ApplicationForm from "../../components/ApplicationForm";
import SideSheet from "../../components/SideSheet";
import Dialog from "../../components/Dialog";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";
import useApplications from "../../hooks/useApplications";
import { createApp } from "../../api";

export default function AdminApplications() {
  return "Applications";
  const { applications, appMap, isLoading } = useApplications({});
  const { appId: selectedAppId } = useParams();
  const [newAppName, setNewAppName] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const selectedApp = selectedAppId ? appMap[selectedAppId] : undefined;

  const onSave = useCallback(() => {
    toast.success("Saved token");
  }, []);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApp(newAppName!, newDate!); // Assuming newAppName and newDate are not null here
      setNewAppName(null);
      setNewDate(null);
      queryClient.invalidateQueries(["applications"]); // Invalidate applications query to refresh data
      toast.success("Application token created successfully");
    } catch (error) {
      toast.error("Failed to create application token");
    }
  };

  return (
    <Dialog controlled isOpen={newAppName !== null}>
      <div className="flex flex-col h-screen">
        <div className="flex overflow-hidden flex-1">
          <SideSheet
            home="/admin/applications"
            sheetBody={selectedApp && <ApplicationForm />}
          >
            <div
              className={twMerge(
                "min-w-[384px] flex-1 flex flex-col justify-stretch p-3 overflow-y-auto",
                // Don't want to have border when loading
                applications ? "divide-y" : "justify-center w-full",
              )}
            >
              {isLoading ? (
                <Spinner className="self-center" />
              ) : (
                <>
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      to={`/admin/applications/${app.id}`}
                      tabIndex={0}
                      className={twJoin(
                        "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                        selectedApp?.id !== app.id
                          ? "hover:bg-gray-100"
                          : "bg-blue-100 hover:bg-blue-200",
                      )}
                    >
                      {app.name}
                      <span className="text-gray-500">{true && "*"}</span>
                    </Link>
                  ))}

                  <button
                    className="p-2 text-center bg-gray-100 cursor-pointer hover:bg-gray-200 focus:z-0 outline-2 outline-blue-500 focus:outline"
                    onClick={() => setNewAppName("")}
                  >
                    Create Application Token
                  </button>
                </>
              )}
            </div>
          </SideSheet>
        </div>
      </div>
      <Dialog.Content
        as="form"
        className="w-full max-w-sm"
        onSubmit={handleCreateApplication}
      >
        <Dialog.Section>
          <h1 className="text-lg">New Application Token</h1>
        </Dialog.Section>
        <Dialog.Section>
          <label className="block mb-2 text-gray-500">
            Name
            <input
              required
              value={newAppName || ""}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setNewAppName(e.target.value)}
            />
          </label>

          <label className="block mb-2 text-gray-500">
            Expiration Date
            <input
              type="datetime-local"
              required
              value={newDate || ""}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>
        </Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
          <button
            type="button"
            className={TextButton}
            onClick={() => setNewAppName(null)}
          >
            Cancel
          </button>
          <input
            value="Save"
            type="submit"
            className={Button}
            disabled={!newAppName}
          />
        </Dialog.Section>
      </Dialog.Content>
    </Dialog>
  );
}

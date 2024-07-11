import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams, Outlet } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";
import LogbookForm from "../../components/LogbookForm";
import { useLogbookFormsStore } from "../../logbookFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import elogLogo from "../assets/temp_elog_logo.png";
import SideSheet from "../../components/SideSheet";
import Dialog from "../../components/Dialog";
import AdminNavbar from "../../components/AdminNavbar";
import { createLogbook } from "../../api";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLogbooks() {
  const {
    logbookMap,
    logbooks,
    isLoading: isLogbooksLoading,
  } = useLogbooks({ requireWrite: true, includeAuth: true });
  const { logbookId: selectedLogbookId } = useParams();
  // null means dialog not open
  const [newLogbookName, setNewLogbookName] = useState<string | null>(null);

  const selectedLogbook = selectedLogbookId
    ? logbookMap[selectedLogbookId]
    : undefined;

  const logbooksEdited = useLogbookFormsStore((state) =>
    Object.keys(state.forms),
  );

  const onSave = useCallback(() => {
    toast.success("Saved logbook");
  }, []);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saveLogbook = useCallback(async () => {
    if (!newLogbookName) {
      return;
    }

    const logbookId = await createLogbook(newLogbookName);
    navigate(`/admin/logbooks/${logbookId}`);
    setNewLogbookName(null);
    queryClient.invalidateQueries({ queryKey: ["logbooks"] });
  }, [newLogbookName, navigate, queryClient]);

  return (
    <Dialog controlled isOpen={newLogbookName !== null}>
      <div className="flex flex-col h-screen">
        <div className="flex overflow-hidden flex-1">
          <SideSheet
            home="/admin/logbooks"
            sheetBody={
              selectedLogbook && (
                <LogbookForm logbook={selectedLogbook} onSave={onSave} />
              )
            }
          >
            <div
              className={twMerge(
                "min-w-[384px] flex-1 flex flex-col justify-stretch p-3 overflow-y-auto",
                // Don't want to have border when loading
                logbooks ? "divide-y" : "justify-center w-full",
              )}
            >
              {/*
                <div className="mb-2 text-xl font-normal text-gray-500">
                  Logbooks
                </div>
                */}
              {isLogbooksLoading ? (
                <Spinner className="self-center" />
              ) : (
                <>
                  {logbooks.map((logbook) => (
                    <Link
                      key={logbook.id}
                      to={`/admin/logbooks/${logbook.id}`}
                      tabIndex={0}
                      className={twJoin(
                        "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                        selectedLogbook?.id !== logbook.id
                          ? "hover:bg-gray-100"
                          : "bg-blue-100 hover:bg-blue-200",
                      )}
                    >
                      {logbook.name}
                      <span className="text-gray-500">
                        {logbooksEdited.includes(logbook.id) && "*"}
                      </span>
                    </Link>
                  ))}

                  <button
                    className="p-2 text-center bg-gray-100 cursor-pointer hover:bg-gray-200 focus:z-0 outline-2 outline-blue-500 focus:outline"
                    onClick={() => setNewLogbookName("")}
                  >
                    Create logbook
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
        onSubmit={(e) => {
          e.preventDefault();
          saveLogbook();
        }}
      >
        <Dialog.Section>
          <h1 className="text-lg">New logbook</h1>
        </Dialog.Section>
        <Dialog.Section>
          <label className="block mb-2 text-gray-500">
            Name
            <input
              required
              value={newLogbookName || ""}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setNewLogbookName(e.target.value)}
            />
          </label>
        </Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
          <button
            type="button"
            className={TextButton}
            onClick={() => setNewLogbookName(null)}
          >
            Cancel
          </button>
          <input
            value="Save"
            type="submit"
            className={Button}
            disabled={!newLogbookName}
          />
        </Dialog.Section>
      </Dialog.Content>
    </Dialog>
  );
}

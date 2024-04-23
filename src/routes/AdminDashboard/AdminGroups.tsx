import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
  } from "react";
  import { toast } from "react-toastify";
  import { Link, useNavigate, useParams, Outlet } from "react-router-dom";
  import { twJoin, twMerge } from "tailwind-merge";
  import Spinner from "../../components/Spinner";
  import useLogbooks from "../../hooks/useLogbooks";
  import elogLogo from "../assets/temp_elog_logo.png";
  import SideSheet from "../../components/SideSheet";
  import Dialog from "../../components/Dialog";
  import AdminNavbar from "../../components/AdminNavbar";
  import { Button, Input, TextButton } from "../../components/base";
  import { useQueryClient } from "@tanstack/react-query";
 
  import useGroups from "../../hooks/useGroups.ts";
  import GroupForm from "../../components/GroupForm.tsx"


  export default function AdminGroups(){

    const {groups , isLoading} = useGroups({search : ""});
    const { group: selectedGroup } = useParams();
      // null means dialog not open
    const [newGroupName, setNewGroupName] = useState<string | null>(null);

    const [ currentGroup, setCurrentGroup] = useState<string>("");
  
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    

    return (
        <Dialog controlled isOpen={newGroupName !== null}>
        <div className="flex flex-col h-screen">
          
          <div className="flex-1 flex overflow-hidden">
            <SideSheet
              home="/admin/groups"
              sheetBody={
                selectedGroup && (
                <GroupForm />
                )
              }
            >
              <div
                className={twMerge(
                  "min-w-[384px] flex-1 flex flex-col justify-stretch p-3 overflow-y-auto",
                  // Don't want to have border when loading
                  groups ? "divide-y" : "justify-center w-full"
                )}
              >

            {isLoading? (
              <Spinner className="self-center" />
            ) : (
              <>
                {groups?.map((group) => (
                  
                  <Link
                    key={group.uid}
                    to={`/admin/groups/${group.commonName}`}
                    tabIndex={0}
                    className={twJoin(
                      "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                      group.uid === group.uid
                        ? "hover:bg-gray-100"
                        : "bg-blue-100 hover:bg-blue-200"
                    )}
                  >
                    {group.commonName}
                    <span className="text-gray-500">
                      {true && "*"}
                    </span>
                  </Link>
                ))}

                <button
                  className="p-2 cursor-pointer bg-gray-100 focus:outline focus:z-0 outline-2 outline-blue-500 text-center hover:bg-gray-200"
                  
                >
                  Create Group
                </button>
              </>
            )}
          </div>
        </SideSheet>
      </div>
    </div>
    <Dialog.Content
      as="form"
      className="max-w-sm w-full"
      
    >
      <Dialog.Section>
        <h1 className="text-lg">New Group</h1>
      </Dialog.Section>
      <Dialog.Section>
        <label className="text-gray-500 block mb-2">
          Name
          <input
            required
            value={newGroupName || ""}
            className={twJoin(Input, "w-full block")}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </label>
      </Dialog.Section>
      <Dialog.Section className="flex gap-3 justify-end">
        <button
          type="button"
          className={TextButton}
          onClick={() => setNewGroupName(null)}
        >
          Cancel
        </button>
        <input
          value="Save"
          type="submit"
          className={Button}
          disabled={!newGroupName}
        />
      </Dialog.Section>
    </Dialog.Content>
  </Dialog>
        
    )
}
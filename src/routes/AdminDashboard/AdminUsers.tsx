import {
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams, Outlet, useOutlet } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";

import UserForm from "../../components/UserForm";
import SideSheet from "../../components/SideSheet";
import Dialog from "../../components/Dialog";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";
//useUsers hook?
import useUsers from "../../hooks/useUsers";

export default function AdminUsers(){
  

  const [userSearch, setUserSearch] = useState("");

  const {users, userMap, isLoading} = useUsers({search : userSearch});
  const { userID: selectedUserId } = useParams();
  const [newUserName, setNewUserName] = useState<
    string | null
  >(null);
  
  const selectedUser = selectedUserId
  ? userMap[selectedUserId]
  : undefined;

  const onSave = useCallback(() => {
    toast.success("Saved logbook");
  }, []);

  const navigate = useNavigate();
  const queryClient = useQueryClient()
  
  const outlet = useOutlet();

  
  function searchFor(value: string) {
    setUserSearch(value);

  }

  return (
    <>
    <form
        className="flex-1 mt-2 mr-2 md:mx-2"
        onSubmit={(e) => {
          e.preventDefault();
          
        }}
      >
        <div className="relative w-full">
          <input
            type="search"
            className={twJoin(Input, "block w-full")}
            placeholder="Search..."
            onChange={(e) => searchFor(e.target.value)}
            
          />
          <button
            type="submit"
            className="absolute top-0 right-0 p-1.5 text-sm font-medium text-white bg-blue-500 rounded-r-lg border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </button>
        </div>
      </form>
    <Dialog controlled isOpen={newUserName !== null}>
    <div className="flex flex-col h-screen">

      <div className="flex-1 flex overflow-hidden">
        <SideSheet
          home="/admin/users"
          sheetBody={
            selectedUser &&
            (<UserForm user={selectedUser} onSave={onSave} />) 
          }
        >
          <div
            className={twMerge(
              "min-w-[384px] flex-1 flex flex-col justify-stretch p-3 overflow-y-auto",
              // Don't want to have border when loading
              users ? "divide-y" : "justify-center w-full"
            )}
          >

            {isLoading ? (
              <Spinner className="self-center" />
            ) : (
              <>
                {users.map((user) => (
                  <Link
                    key={user.uid}
                    to={`/admin/users/${user.uid}`}
                    tabIndex={0}
                    className={twJoin(
                      "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                      selectedUser?.uid !== user.uid
                        ? "hover:bg-gray-100"
                        : "bg-blue-100 hover:bg-blue-200"
                    )}
                  >
                    {user.surname}
                    <span className="text-gray-500">
                      {}
                    </span>
                  </Link>
                ))}

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
        <h1 className="text-lg">New User</h1>
      </Dialog.Section>
      <Dialog.Section>
        <label className="text-gray-500 block mb-2">
          Name
          <input
            required
            value={newUserName || ""}
            className={twJoin(Input, "w-full block")}
            onChange={(e) => setNewUserName(e.target.value)}
          />
        </label>
      </Dialog.Section>
      <Dialog.Section className="flex gap-3 justify-end">
        <button
          type="button"
          className={TextButton}
          onClick={() => setNewUserName(null)}
        >
          Cancel
        </button>
        <input
          value="Save"
          type="submit"
          className={Button}
          disabled={!newUserName}
        />
      </Dialog.Section>
    </Dialog.Content>
  </Dialog>
  </>
    )
}
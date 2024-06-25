import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  AuthorizationType,
  LogbookWithAuth,
  User,
  Logbook
} from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";
import useLogbooks from "../hooks/useLogbooks";
import { useLogbookFormsStore } from "../logbookFormsStore";
import { localToUtc, utcToLocal } from "../utils/datetimeConversion";
import reportServerError from "../reportServerError";
import Select from "./Select";
// import useGroups from "../hooks/useGroups";
import useUsers from "../hooks/useUsers";
import createUserAuthorization from "./LogbookForm";

interface Props {
  user: User;
  onSave: () => void;
}

const DEFAULT_AUTHORIZATION: AuthorizationType = "Read";

let idCounter = 0;

export default function UserForm({user}: Props) {


  //  const [form, setForm, removeForm] = useLogbookFormsStore((state) =>
  //    state.startEditing(selectedLogbook)
  //  );
  let userAuthorizations: string[]= [];

  const logbookAuthorizations: string [] = [];
  const queryClient = useQueryClient();

  const [newUserAuthorization, setNewUserAuthorizations] = useState<
    string | null
  >(null);

  // const [selectedLogbook, setSelectedLogbook] = useState<LogbookWithAuth>(null);


  const [userSearch, setUserSearch] = useState("");

 
  const {
    logbookMap,
    logbooks,
    isLoading: isLogbooksLoading,
  } = useLogbooks({ requireWrite: true, includeAuth: false });
 

  return (
    <div className="px-3 pb-3">
                   
      <div className="text-gray-500">{user.surname}'s Authorizations</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          userAuthorizations.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {userAuthorizations.length === 0 ? (
          <div className="my-3">No logbook authorizations for {user.surname}. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {userAuthorizations.map((authorization) => (
                <div
                  // key={authorization.owner}
                  className="flex justify-between items-center py-1 px-2"
                >
                  {/* <div className="flex-grow">{authorization.owner}</div> */}
                  <div className="flex-grow">Fix this</div>
                  <Select
                    className="w-32"
                    // value={authorization.authorizationType}
                    value="Fix me"
                    options={["Write", "Read"]}
                    setValue={()=> console.log("Fix this function")}
                    // setValue={(updatedAuthorization) => {
                    //   const updatedAuthorizations = [...form.authorizations];
                    //   const index = form.authorizations.findIndex(
                    //     (otherAuthorization) =>
                    //       otherAuthorization === authorization
                    //   );

                    //   if (
                    //     updatedAuthorization !== "Read" &&
                    //     updatedAuthorization !== "Write"
                    //   ) {
                    //     return;
                    //   }

                    //   updatedAuthorizations[index] = {
                    //     ...updatedAuthorizations[index],
                    //     authorizationType: updatedAuthorization,
                    //   };
                    //   setForm({
                    //     ...form,
                    //     authorizations: updatedAuthorizations,
                    //   });
                    // }}
                    nonsearchable
                  />

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    tabIndex={0}
                    className={twJoin(IconButton, "text-gray-500")}
                    // onClick={() =>
                    //   removeAuthorization(
                    //     form.authorizations.findIndex(
                    //       (otherAuthorization) =>
                    //         otherAuthorization === authorization
                    //     )
                    //   )
                    // }
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
        <form
          noValidate
          className="relative mt-2 w-full"
          // onSubmit={createUserAuthorization}
        >
          <Select
            className="pr-12 w-full"
            value={newUserAuthorization}
            onSearchChange={setUserSearch}
            isLoading={isLogbooksLoading}
            options={logbooks.map(logbook => logbook.name) || []}
            // options={(users || [])
            //   .filter(
            //     (user) =>
            //       !userAuthorizations.some(
            //         (authorization) => authorization.owner === user.mail
            //       )
            //   )
            //   .map((user) => ({ label: user.gecos, value: user.mail }))}
            setValue={setNewUserAuthorizations}
          />
          <button
            type="submit"
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
            disabled={!newUserAuthorization}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </form>
      </div>
      <button
        // disabled={updated}
        className={twJoin(Button, "block ml-auto mt-3")}
        // onClick={save}
      >
        Save
      </button>
    </div>
  );
}
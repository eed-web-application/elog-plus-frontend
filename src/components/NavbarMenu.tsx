import { useEffect, useState } from "react";
import DevSelectUser from "./DevSelectUser";
import Dialog from "./Dialog";
import InfoDialog from "./InfoDialog";
import BugReport from "./BugReport";
import AccountButton from "./AccountButton";
import Button from "./Button";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { useDraftsStore } from "../draftsStore";
import useIsRoot from "../hooks/useIsRoot";
import { Link } from "react-router-dom";

export default function NavbarMenu() {
  const isSmallScreen = useIsSmallScreen();
  const [open, setOpen] = useState(false);

  const isRoot = useIsRoot();
  const hasNewEntryDraft = useDraftsStore(({ drafts }) =>
    Boolean(drafts["newEntry"]),
  );

  useEffect(() => {
    if (!isSmallScreen) {
      setOpen(false);
    }
  }, [isSmallScreen]);

  const buttons = (
    <>
      {isRoot && (
        <Button
          as={Link}
          to={{ pathname: "/admin/logbooks" }}
          className="block"
        >
          Admin
        </Button>
      )}
      <Button
        as={Link}
        to={{
          pathname: "/new-entry",
          search: window.location.search,
          hash: window.location.hash,
        }}
        className="relative block"
      >
        New Entry
        {hasNewEntryDraft && (
          <div className="absolute top-0 right-0 w-4 h-4 text-black bg-gray-200 rounded-full shadow-xl translate-x-1.5 -translate-y-1.5 p-[3px]"></div>
        )}
      </Button>
    </>
  );

  const iconButtons = (
    <div className="flex ml-auto">
      <BugReport />

      <Dialog>
        <Dialog.Content>
          <InfoDialog />
        </Dialog.Content>
        <Dialog.Trigger>
          <Button variant="iconLarge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </Button>
        </Dialog.Trigger>
      </Dialog>

      <AccountButton />
    </div>
  );

  if (!isSmallScreen) {
    return (
      <>
        {import.meta.env.MODE === "development" && (
          <DevSelectUser className="block w-full" />
        )}

        {buttons}
        {iconButtons}
      </>
    );
  }

  return (
    <>
      <Button variant="iconSquare" onClick={() => setOpen((open) => !open)}>
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </Button>

      {open && (
        <div className="w-full flex gap-2 p-2 bg-gray-100 rounded-lg">
          {import.meta.env.MODE === "development" && (
            <DevSelectUser className="block w-full" />
          )}

          {buttons}

          {iconButtons}
        </div>
      )}
    </>
  );
}

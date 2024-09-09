import { ComponentProps, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { NavLink } from "react-router-dom";
import { twJoin } from "tailwind-merge";
import Spinner from "../Spinner";
import { Input } from "../base";
import Dialog from "../Dialog";
import Button from "../Button";

export interface Item {
  label: string;
  link: string;
  edited: boolean;
  readOnly: boolean;
}

export interface Props extends ComponentProps<"div"> {
  items: Item[];
  isLoading?: boolean;
  home: string;
  createLabel?: string;
  createDialog?: JSX.Element;
  onCreate?: () => void;
  onSearchChange: (search: string) => void;
  onBottomVisible?: () => void;
}

export default function AdminResource({
  items,
  home,
  children,
  isLoading,
  createLabel,
  createDialog,
  onSearchChange,
  onBottomVisible,
}: Props) {
  const loaderRef = useRef(null);

  const hasItems = items.length > 0;

  useEffect(() => {
    // We only want to check if bottom is visible when there are items.
    // Otherwise, when observe the loaderRef, IntersectionObserver's callback
    // is called immediately without the first load of items being rendered.
    if (!hasItems) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0]?.isIntersecting) {
          onBottomVisible?.();
        }
      },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [onBottomVisible, hasItems]);

  return (
    <SideSheet home={home} sheetBody={children}>
      <div
        className={twJoin(
          "min-w-[384px] flex-1 flex flex-col p-3 overflow-y-auto",
          isLoading && "w-full",
        )}
      >
        <div className="flex flex-row justify-center items-center mb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex-1 relative w-full"
          >
            <input
              type="search"
              className={twJoin(Input, "block w-full")}
              placeholder="Search..."
              onChange={(e) => onSearchChange(e.target.value)}
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
          </form>

          {createLabel && createDialog && (
            <Dialog>
              <Dialog.Content>{createDialog}</Dialog.Content>
              <Dialog.Trigger>
                <Button type="button" className="ml-2">
                  {createLabel}
                </Button>
              </Dialog.Trigger>
            </Dialog>
          )}
        </div>

        {items.map((item) => (
          <NavLink
            key={item.link}
            to={item.link}
            className={({ isActive }) =>
              twJoin(
                "p-2 cursor-pointer focus:outline focus:z-0 outline-2 outline-blue-500 overflow-x-clip overflow-y-visible overflow-ellipsis flex",
                isActive
                  ? "bg-blue-100 hover:bg-blue-200"
                  : "hover:bg-gray-100",
              )
            }
          >
            {item.label}
            <span className="text-gray-500">{item.edited && "*"}</span>
            {item.readOnly && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 ml-1 text-gray-500 self-center"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            )}
          </NavLink>
        ))}

        <div ref={loaderRef} className="flex justify-center">
          {isLoading && <Spinner className="self-center mt-3 mx-auto" />}
        </div>
      </div>
    </SideSheet>
  );
}

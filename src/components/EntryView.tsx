import { Entry } from "../api";
import { IconButton } from "./base";
import cn from "classnames";

export interface Props {
  entry: Entry;
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  onCancel: () => void;
}

export default function EntryView({
  entry,
  fullscreen,
  setFullscreen,
  onCancel,
}: Props) {
  return (
    <>
      <div
        className={cn(
          "overflow-y-auto",
          "m-auto container absolute left-0 right-0 top-0 bottom-0 bg-white z-30 mt-6 rounded-lg",
          fullscreen ||
            "sm:w-1/2 sm:relative sm:rounded-none sm:mt-0 sm:bg-transparent"
        )}
      >
        <div className="flex items-center px-1 pt-1">
          {fullscreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={IconButton}
              tabIndex={0}
              onClick={() => setFullscreen(false)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={IconButton}
                tabIndex={0}
                onClick={onCancel}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                  className="block sm:hidden"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  className="hidden sm:block"
                />
              </svg>
            </>
          )}

          <div className="flex-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
            {entry.title}
          </div>

          {fullscreen || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={cn(IconButton, "sm:block hidden")}
              tabIndex={0}
              onClick={() => setFullscreen(true)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          )}
        </div>
        <div
          className="p-3 pt-2"
          dangerouslySetInnerHTML={{ __html: entry.text }}
        ></div>
      </div>
      <div
        className={cn(
          "absolute left-0 right-0 bottom-0 top-0 bg-gray-500 bg-opacity-50 z-20",
          fullscreen || "sm:hidden"
        )}
      />
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Logbook, fetchLogbooks } from "../api";
import Pane from "../components/Pane";
import Spinner from "../components/Spinner";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import cn from "classnames";
import LogbookForm from "../components/LogbookForm";
import { useLogbookFormsStore } from "../logbookFormsStore";
import { Link, useParams } from "react-router-dom";

const MIN_PANE_WIDTH = 384;

export default function Admin() {
  const [logbooks, setLogbooks] = useState<Logbook[] | null>(null);
  const { logbookId: selectedLogbookId } = useParams();
  const selectedLogbook = logbooks?.find(({ id }) => id === selectedLogbookId);
  const logbooksEdited = useLogbookFormsStore((state) =>
    Object.keys(state.forms)
  );

  const isSmallScreen = useIsSmallScreen();
  const bodyRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    fetchLogbooks().then(setLogbooks);
  }, [setLogbooks]);

  useEffect(() => {
    if (!logbooks) {
      refresh();
    }
  }, [logbooks, refresh]);

  const mouseMoveHandler = useCallback((e: MouseEvent) => {
    if (bodyRef.current && gutterRef.current) {
      const gutterRect = gutterRef.current.getBoundingClientRect();
      bodyRef.current.style.flexBasis =
        Math.max(e.clientX - gutterRect.width / 2, MIN_PANE_WIDTH) + "px";
    }
  }, []);

  const endDrag = useCallback(() => {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", endDrag);
  }, [mouseMoveHandler]);

  const startDrag = useCallback(() => {
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", endDrag);
  }, [mouseMoveHandler, endDrag]);

  return (
    <div className="flex max-h-screen">
      <div
        ref={bodyRef}
        className={cn(
          "w-1/2 flex flex-col mt-3 justify-stretch p-3 overflow-y-auto",
          // Don't want to have border when loading
          logbooks ? "divide-y" : "justify-center w-full"
        )}
      >
        <div className="text-xl mb-2 font-normal text-gray-500">Logbooks</div>
        {logbooks ? (
          logbooks.map((logbook) => (
            <Link
              key={logbook.id}
              to={`/admin/${logbook.id}`}
              tabIndex={0}
              className={cn(
                "p-2 hover:bg-gray-100 cursor-pointer",
                selectedLogbook?.id === logbook.id &&
                  "bg-blue-100 hover:!bg-blue-200"
              )}
            >
              {logbook.name}
              <span className="text-gray-500">
                {logbooksEdited.includes(logbook.id) && "*"}
              </span>
            </Link>
          ))
        ) : (
          <Spinner className="self-center" />
        )}
      </div>
      <div
        className="relative border-r cursor-col-resize select-none"
        onMouseDown={startDrag}
        ref={gutterRef}
      >
        <div className="absolute -left-3 w-6 h-full" />
      </div>
      <div
        className={cn("pb-3", !isSmallScreen && "flex-1 flex-shrink")}
        style={{ minWidth: isSmallScreen ? "auto" : MIN_PANE_WIDTH }}
      >
        <Pane home="/admin">
          {selectedLogbook && (
            <LogbookForm logbook={selectedLogbook} onSave={refresh} />
          )}
        </Pane>
      </div>
    </div>
  );
}

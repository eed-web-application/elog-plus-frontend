import { ComponentProps, ReactNode, useCallback, useRef } from "react";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import Pane, { Props as PaneProps } from "./Pane";
import { twJoin } from "tailwind-merge";

export interface Props extends ComponentProps<"div">, Pick<PaneProps, "home"> {
  sheetBody?: ReactNode;
}

/**
 * Adds a resizable side sheet side-by-side with the body and when the screen
 * is small enough, the sheet will overlay the body as a modal.
 */
export default function SideSheet({
  children,
  sheetBody,
  home,
  ...rest
}: Props) {
  const isSmallScreen = useIsSmallScreen();
  const sheetRef = useRef<HTMLDivElement>(null);

  const mouseMoveHandler = useCallback((e: MouseEvent) => {
    if (sheetRef.current) {
      const sheetRect = sheetRef.current.getBoundingClientRect();

      sheetRef.current.style.flexBasis = `${sheetRect.right - e.clientX}px`;
    }
  }, []);

  const endDrag = useCallback(() => {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", endDrag);
  }, [mouseMoveHandler]);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", endDrag);
    },
    [mouseMoveHandler, endDrag],
  );

  return (
    <div className="flex overflow-hidden flex-1" {...rest}>
      {children}
      {sheetBody && (
        <>
          {!isSmallScreen && (
            <div
              className="relative border-r select-text cursor-col-resize"
              onMouseDown={startDrag}
            >
              {/* We specifically want the handle/gutter to lean more right 
                than left, because we don't want overlay it above the the scroll 
                bar for the entry list */}
              <div className="absolute -left-1 w-4 h-full select-text" />
            </div>
          )}
          <Pane
            className={twJoin(
              "overflow-y-auto pb-3 basis-1/2 relative",
              !isSmallScreen && "min-w-[384px]",
            )}
            home={home}
            ref={sheetRef}
          >
            {sheetBody}
          </Pane>
        </>
      )}
    </div>
  );
}

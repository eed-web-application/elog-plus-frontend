import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ComponentProps, useState } from "react";
import { Attachment, getAttachmentPreviewURL } from "../api";
import { BackDrop } from "./base";
import Spinner from "./Spinner";
import Button from "./Button";
import { twJoin, twMerge } from "tailwind-merge";

export default function Figure({
  figure,
  label,
  ...rest
}: {
  figure: Attachment;
  label: React.ReactNode;
} & ComponentProps<"div">) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <div {...rest}>
        <div className="flex w-full relative items-center text-gray-500 overflow-hidden whitespace-nowrap">
          {label}
        </div>
        <img
          ref={refs.setReference}
          {...getReferenceProps({
            tabIndex: 0,
            src: getAttachmentPreviewURL(figure.id),
            className: twJoin(
              "cursor-pointer w-full my-0 max-h-48 object-contain object-left-top",
              isLoaded ? "block" : "hidden",
            ),
            onLoad: () => setIsLoaded(true),
          })}
        />
        {!isLoaded && <Spinner className="my-3 w-full" />}
      </div>
      {isOpen && (
        <FloatingPortal>
          <FloatingOverlay
            lockScroll
            className={twMerge(BackDrop, "flex justify-center items-center")}
            // Need to be higher than sticky entry rows which are <100
            style={{ zIndex: 105 }}
          >
            <FloatingFocusManager context={context}>
              <div ref={refs.setFloating} {...getFloatingProps()}>
                <Button
                  variant="icon"
                  className="absolute top-0 left-0 m-3 bg-gray-700 hover:bg-gray-600 focus:bg-gray-600 text-gray-200 ring-blue-50"
                  onClick={() => setIsOpen(false)}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
                <img
                  className="max-h-screen"
                  src={getAttachmentPreviewURL(figure.id)}
                />
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
}

import cn from "classnames";
import { PropsWithChildren, useRef, useState } from "react";
import {
  useFloating,
  useDismiss,
  useInteractions,
  arrow,
  shift,
} from "@floating-ui/react";
import { MouseEvent } from "react";

export interface Props {
  enabled: boolean;
  label: string;
  onClose?: () => void;
  onDisable?: () => void;
  className?: string;
}

export default function Filter({
  enabled,
  children,
  label,
  onClose,
  onDisable,
  className,
}: PropsWithChildren<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        onClose?.();
      }
      setIsOpen(isOpen);
    },
    placement: "bottom",

    middleware: [
      shift(),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  function onClick() {
    if (!isOpen) {
      onClose?.();
    }
    setIsOpen((isOpen) => !isOpen);
  }

  function disable(e: MouseEvent<SVGSVGElement>) {
    e.stopPropagation();
    onDisable?.();
    setIsOpen(false);
  }

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <button
        className={cn(
          "flex items-center text-gray-500 border rounded-2xl pl-3 pr-2",
          enabled
            ? "bg-blue-100 border-blue-100 hover:bg-blue-200 hover:border-blue-200"
            : "bg-gray-50 border-gray-300 hover:bg-gray-200 hover:border-gray-400",
          className
        )}
        onClick={onClick}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <div className="py-1.5">{label}</div>
        {enabled ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-1 w-8 h-8 p-1 hover:bg-blue-300 rounded-full"
            onClick={disable}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="ml-2 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        )}
      </button>
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="mx-3 m-1 shadow bg-white rounded-lg"
          {...getFloatingProps()}
        >
          {children}
        </div>
      )}
    </>
  );
}

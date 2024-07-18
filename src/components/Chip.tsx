import React, { ComponentPropsWithRef, forwardRef } from "react";
import { twJoin, twMerge } from "tailwind-merge";

export interface Props extends ComponentPropsWithRef<"div"> {
  delectable?: boolean;
  clickable?: boolean;
  leftIcon?: JSX.Element;
  onDelete?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const Chip = forwardRef<HTMLDivElement, Props>(function Chip(
  { delectable, clickable, className, children, leftIcon, onDelete, ...rest },
  ref,
) {
  const base = twJoin(
    "border-gray-400 border text-sm rounded-full flex justify-center items-center whitespace-nowrap w-fit",
    clickable && "hover:bg-gray-200",
  );

  if (!delectable && !leftIcon) {
    return (
      <div
        className={twMerge(
          base,
          "px-1.5 py-0.5 leading-none",
          clickable && "cursor-pointer",
          className,
        )}
        ref={ref}
        tabIndex={clickable ? 0 : undefined}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        base,
        "overflow-hidden",
        clickable && "cursor-pointer",
        className,
      )}
      tabIndex={clickable ? 0 : undefined}
      ref={ref}
      {...rest}
    >
      {leftIcon}

      <div
        className={twJoin(
          "py-0.5 leading-none",
          !leftIcon && "pl-1.5",
          !delectable && "pr-1.5",
        )}
      >
        {children}
      </div>

      {delectable && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="px-1 w-7 hover:bg-gray-200"
          tabIndex={0}
          onClick={onDelete}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
});

export default Chip;

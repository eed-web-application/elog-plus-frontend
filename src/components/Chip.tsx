import React, { ComponentPropsWithRef, forwardRef } from "react";
import cn from "classnames";

export interface Props extends ComponentPropsWithRef<"div"> {
  delectable?: boolean;
  clickable?: boolean;
  onDelete?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const Chip = forwardRef<HTMLDivElement, Props>(function Tag(
  { delectable, clickable, className, children, onDelete, ...rest },
  ref
) {
  const base = cn(
    "border-gray-400 border text-sm rounded-full flex justify-center items-center whitespace-nowrap w-fit",
    clickable && "hover:bg-gray-200"
  );

  if (!delectable) {
    return (
      <div
        className={cn(base, "px-1.5 py-0.5 leading-none", className)}
        ref={ref}
        tabIndex={clickable ? 0 : undefined}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(base, className, "overflow-hidden")} ref={ref} {...rest}>
      <div className="pl-1.5 py-0.5 leading-none">{children}</div>

      {delectable && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-7 px-1 hover:bg-gray-200"
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

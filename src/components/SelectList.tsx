import { ComponentPropsWithoutRef, forwardRef } from "react";
import Spinner from "./Spinner";

export interface Props extends ComponentPropsWithoutRef<"div"> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
}

const SelectList = forwardRef<HTMLDivElement, Props>(function SelectList(
  { isLoading, isEmpty, emptyLabel, children, ...rest },
  ref
) {
  return (
    <div ref={ref} {...rest}>
      {isEmpty || isLoading ? (
        <div className="text-gray-500 text-center w-full py-3">
          {isLoading ? (
            <Spinner className="m-auto" />
          ) : (
            emptyLabel || "No options"
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
});

export default SelectList;

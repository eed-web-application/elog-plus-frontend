import {
  ComponentPropsWithRef,
  ElementType,
  forwardRef,
  JSXElementConstructor,
} from "react";
import { twJoin, twMerge } from "tailwind-merge";

type IntrinsicAttributes<
  E extends
    | keyof JSX.IntrinsicElements
    | JSXElementConstructor<Record<string, unknown>>,
> = JSX.LibraryManagedAttributes<E, ComponentPropsWithRef<E>>;

interface OwnProps<E extends ElementType = ElementType> {
  as?: E;
  deletable?: boolean;
  clickable?: boolean;
  leftIcon?: JSX.Element;
  onDelete?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

export type Props<E extends ElementType> = OwnProps<E> &
  Omit<IntrinsicAttributes<E>, keyof OwnProps>;

const Chip = forwardRef(function Chip<E extends ElementType>(
  {
    as,
    deletable,
    clickable,
    className,
    children,
    leftIcon,
    onDelete,
    ...rest
  }: Props<E>,
  ref: ComponentPropsWithRef<E>["ref"],
) {
  const base = twJoin(
    "border-gray-400 border text-sm rounded-full flex justify-center items-center whitespace-nowrap w-fit outline-none",
    clickable && "hover:bg-gray-200 focus:bg-gray-200",
  );

  const Component = as ?? "div";

  if (!deletable && !leftIcon) {
    return (
      <Component
        className={twMerge(base, "px-1.5 py-0.5 leading-none", className)}
        ref={ref}
        {...rest}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={twMerge(base, "overflow-hidden", className)}
      ref={ref}
      {...rest}
    >
      {leftIcon}

      <div
        className={twJoin(
          "py-0.5 leading-none",
          !leftIcon && "pl-1.5",
          !deletable && "pr-1.5",
        )}
      >
        {children}
      </div>

      {deletable && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="px-1 w-7 hover:bg-gray-200 cursor-pointer"
          onClick={onDelete}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </Component>
  );
});

export default Chip as <E extends ElementType = "div">(
  props: Props<E>,
) => JSX.Element;

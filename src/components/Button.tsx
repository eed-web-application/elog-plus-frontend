import {
  ComponentPropsWithRef,
  ElementType,
  forwardRef,
  JSXElementConstructor,
} from "react";
import { twMerge } from "tailwind-merge";
import Spinner from "./Spinner";

type IntrinsicAttributes<
  E extends
    | keyof JSX.IntrinsicElements
    | JSXElementConstructor<Record<string, unknown>>,
> = JSX.LibraryManagedAttributes<E, ComponentPropsWithRef<E>>;

interface OwnProps<E extends ElementType = ElementType> {
  as?: E;
  variant?: keyof typeof variants;
  isLoading?: boolean;
}

export type Props<E extends ElementType> = OwnProps<E> &
  Omit<IntrinsicAttributes<E>, keyof OwnProps>;

const variants = {
  button:
    "cursor-pointer py-1 px-2 bg-blue-500 rounded-lg text-white border border-blue-500 hover:bg-blue-600 hover:border-blue-600 outline-2 focus:outline outline-blue-300 outline-offset-0 disabled:cursor-auto disabled:bg-blue-300 disabled:border-blue-300 disabled:hover:bg-blue-300 disabled:text-gray-100",
  text: "cursor-pointer py-1 px-2 rounded-lg font-medium text-blue-500 hover:bg-blue-100 disabled:hover:bg-transparent disabled:text-blue-200",
  icon: "w-9 h-9 p-2 hover:bg-gray-200 rounded-full cursor-pointer outline-2 outline-offset-0 outline-blue-500 focus:outline select-none disable:hover:bg-transparent disable:focus:outline-none disable:cursor-auto",
};

const Button = forwardRef(function Button<E extends ElementType>(
  { as, className, variant, isLoading, children, ...rest }: Props<E>,
  ref: ComponentPropsWithRef<E>["ref"],
) {
  const Component = as ?? "button";

  const twVariant = variants[variant ?? "button"];

  return (
    <Component
      ref={ref}
      className={twMerge(twVariant, isLoading && "relative", className)}
      {...rest}
    >
      {isLoading ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="tiny" />
          </div>
          <div className="invisible">{children}</div>
        </>
      ) : (
        children
      )}
    </Component>
  );
}) as <E extends ElementType = "button">(props: Props<E>) => JSX.Element;

export default Button;

import { useContext } from "react";
import IsPaneFullscreen from "../IsPaneFullscreenContext";
import { twJoin } from "tailwind-merge";

export default function SheetErrorBoundary({ goal }: { goal: string }) {
  const isPaneFullscreen = useContext(IsPaneFullscreen);

  return (
    <div
      className={twJoin(
        "max-w-64 mx-auto flex flex-col text-center justify-center items-center py-12",
        !isPaneFullscreen && "absolute inset-0",
      )}
    >
      <div className="text-4xl">Uh oh 😕</div>
      <div className="text-lg">Something went wrong while trying to {goal}</div>
    </div>
  );
}

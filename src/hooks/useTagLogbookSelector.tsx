import { useCallback, useState } from "react";
import TagLogbookSelectorDialog from "../components/TagLogbookSelectorDialog";
import { Logbook } from "../api";

export default function useTagLogbookSelector() {
  const [tag, setTag] = useState<string | null>(null);
  const [logbooks, setLogbooks] = useState<Logbook[] | null>(null);
  const [onSave, setOnSave] = useState<
    ((logbooks: string[] | null) => void) | null
  >(null);

  const select = useCallback(async (tag: string, logbooks: Logbook[]) => {
    setTag(tag);
    setLogbooks(logbooks);

    return new Promise<string[] | null>((resolve) => setOnSave(() => resolve));
  }, []);

  function close() {
    setTag(null);
    setLogbooks(null);
    setOnSave(null);
  }

  const Dialog = (
    <TagLogbookSelectorDialog
      isOpen={Boolean(tag && logbooks && onSave)}
      tag={tag || ""}
      logbooks={logbooks || []}
      onSave={(logbooks) => {
        close();
        onSave?.(logbooks);
      }}
      onClose={() => {
        close();
        onSave?.(null);
      }}
    />
  );

  return { select, Dialog };
}

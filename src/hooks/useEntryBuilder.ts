import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  EntryNew,
  ServerError,
  createEntry,
  createTag,
  followUp,
  supersede,
} from "../api";
import {
  DraftFactory,
  LocalUploadedAttachment,
  useDraftsStore,
} from "../draftsStore";
import useAttachmentUploader, {
  LocalAttachment,
} from "./useAttachmentUploader";
import reportServerError from "../reportServerError";

export interface Props {
  kind: DraftFactory;
  onEntrySaved: (id: string) => void;
}

/**
 * Handles all the logic in creating new entries: draft storage,
 * draft validation, attachments uploading, creating new tags, etc.
 */
export default function useEntryBuilder({ kind, onEntrySaved }: Props) {
  const queryClient = useQueryClient();
  const [draft, updateDraft, removeDraft] = useDraftsStore((state) =>
    state.startDrafting(kind)
  );

  const [invalidFields, setInvalidFields] = useState<Field[]>([]);

  const {
    uploading: attachmentsUploading,
    upload: uploadAttachment,
    cancel: cancelUploadingAttachment,
  } = useAttachmentUploader();

  const validators = {
    title: () => Boolean(draft.title),
    logbooks: () => Boolean(draft.logbooks.length !== 0),
    eventAt: () => draft.eventAt !== null,
    shiftName: () =>
      // If there is not only one logbook selected, then shift summaries are
      // disabled and thus valid
      draft.logbooks.length !== 1 ||
      !draft.summarizes.checked ||
      Boolean(draft.summarizes.shiftId),
    shiftDate: () =>
      draft.logbooks.length !== 1 ||
      !draft.summarizes.checked ||
      Boolean(draft.summarizes.date),
    // Ensure all attachments are downloaded
    attachments: () => attachmentsUploading.length === 0,
  };

  type Field = keyof typeof validators;

  function validateField(field: Field): boolean {
    if (validators[field]()) {
      setInvalidFields((invalid) =>
        invalid.filter((invalidField) => invalidField !== field)
      );
      return true;
    }

    if (!invalidFields.includes(field)) {
      setInvalidFields((invalid) => [...invalid, field]);
    }
    return false;
  }

  const saveEntry = useCallback(
    async (newEntry: EntryNew) => {
      try {
        if (kind === "newEntry") {
          return await createEntry(newEntry);
        }
        if (kind[0] === "superseding") {
          return await supersede(kind[1].id, newEntry);
        }
        return await followUp(kind[1].id, newEntry);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }

        reportServerError("Could not save entry", e);
      }
    },
    [kind]
  );

  async function submitEntry() {
    let invalid = false;
    for (const field in validators) {
      if (!validateField(field as Field)) {
        invalid = true;
      }
    }
    if (invalid) {
      return;
    }

    const tagIds: string[] = [];

    for (const tag of draft.tags) {
      if (typeof tag === "string") {
        tagIds.push(tag);
      } else {
        const tagId = await createTag(tag.logbook, tag.name);

        tagIds.push(tagId);
        queryClient.invalidateQueries({ queryKey: ["logbook", tag.logbook] });
      }
    }

    const newEntry = {
      ...draft,
      attachments: draft.attachments.map(
        // We have already verified that all the ids are non null in the
        // attachment validator, so this is fine
        (attachment) => attachment.id as string
      ),
      summarizes: draft.summarizes.checked ? draft.summarizes : undefined,
      tags: tagIds,
      // This should be fine as the validators should ensure that this Draft
      // is indeed a EntryNew
    } as EntryNew;

    const id = await saveEntry(newEntry);
    if (id) {
      removeDraft();

      queryClient.invalidateQueries({ queryKey: ["entries"] });
      if (kind !== "newEntry") {
        queryClient.invalidateQueries({ queryKey: ["entry", kind[1].id] });
      }
      if (newEntry.summarizes) {
        queryClient.setQueryData(
          [
            "shiftSummary",
            newEntry.summarizes.shiftId,
            newEntry.summarizes.date,
          ],
          id
        );
      }

      onEntrySaved(id);
    }
  }

  const uploadAttachments = useCallback(
    async (files: File[]) => {
      const attachments = (
        await Promise.all(files.map(uploadAttachment))
      ).filter((x) => x) as LocalUploadedAttachment[];

      updateDraft({
        ...draft,
        attachments: draft.attachments.concat(attachments),
      });
    },
    [draft, updateDraft, uploadAttachment]
  );

  const removeAttachment = useCallback(
    (attachment: LocalAttachment) => {
      if (attachment.id) {
        updateDraft({
          ...draft,
          attachments: draft.attachments.filter(
            ({ id }) => id !== attachment.id
          ),
        });
        return;
      }

      cancelUploadingAttachment(attachment.fileName);
    },
    [cancelUploadingAttachment, draft, updateDraft]
  );

  return {
    draft,
    updateDraft,
    validateField,
    invalidFields,
    uploadAttachments,
    removeAttachment,
    attachmentsUploading,
    submitEntry,
    removeDraft,
  };
}

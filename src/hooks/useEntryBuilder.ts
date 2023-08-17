import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  EntryNew,
  Logbook,
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
import useLogbooks from "./useLogbooks";

export interface Props {
  kind: DraftFactory;
  /**
   * When multiple logbooks are selected and the user created a new tag,
   * this function is used to select which logbook the tag is saved in.
   */
  selectLogbookForNewTag: (
    tagName: string,
    logbooks: Logbook[]
  ) => Promise<string | null>;
  onEntrySaved: (id: string) => void;
}

/**
 * Handles all the logic in creating new entries: draft storage,
 * draft validation, attachments uploading, creating new tags, etc.
 */
export default function useEntryBuilder({
  kind,
  selectLogbookForNewTag,
  onEntrySaved,
}: Props) {
  const queryClient = useQueryClient();
  const { logbookMap } = useLogbooks({ critical: false });
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
    shiftName: () => !draft.summarizes || Boolean(draft.summarizes.shiftId),
    shiftDate: () => !draft.summarizes || Boolean(draft.summarizes.date),
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

  const createTagAndUpdateDraft = useCallback(
    async (name: string): Promise<string | undefined> => {
      if (draft.logbooks.length === 0) {
        return;
      }

      let logbook: string | null = draft.logbooks[0];

      let tagId: string;
      if (logbook && draft.logbooks.length === 1) {
        tagId = await createTag(logbook, name);
      } else {
        const selectedLogbooks = draft.logbooks.map((id) => logbookMap[id]);

        logbook = await selectLogbookForNewTag(name, selectedLogbooks);

        // User hit cancel
        if (!logbook) {
          return;
        }

        tagId = await createTag(logbook, name);
      }

      updateDraft({
        ...draft,
        tags: draft.tags.map((tag) =>
          typeof tag !== "string" && tag.new === name ? tagId : tag
        ),
      });

      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "tags" &&
          Array.isArray(queryKey[1]) &&
          (queryKey[1].includes(logbook) || queryKey[1].length === 0),
      });

      return tagId;
    },
    [draft, logbookMap, queryClient, selectLogbookForNewTag, updateDraft]
  );

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

    const tagIds = [];

    for (const tag of draft.tags) {
      if (typeof tag === "string") {
        tagIds.push(tag);
      } else {
        const newTagId = await createTagAndUpdateDraft(tag.new);

        if (!newTagId) {
          return;
        }

        tagIds.push(newTagId);
      }
    }

    const newEntry = {
      ...draft,
      attachments: draft.attachments.map(
        // We have already verified that all the ids are non null in the
        // attachment validator, so this is fine
        (attachment) => attachment.id as string
      ),
      tags: tagIds,
      // This should be fine as the validators should ensure that this Draft
      // is indeed a EntryNew
    } as EntryNew;

    const id = await saveEntry(newEntry);
    if (id) {
      removeDraft();

      queryClient.invalidateQueries({ queryKey: ["entries"] });
      if (kind !== "newEntry") {
        queryClient.invalidateQueries({ queryKey: ["entry", kind[1]] });
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

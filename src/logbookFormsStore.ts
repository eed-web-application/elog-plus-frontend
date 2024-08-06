import { LogbookWithAuth, Shift, Tag } from "./api";
import createAdminFormsStore, {
  LocalAuthorization,
} from "./createAdminFormsStore";
import { hhmmToMinutes } from "./utils/datetimeConversion";

/**
 * Shift that has not been uploaded to the server yet. `id`s starting with an
 * underscore are not uploaded yet.
 */
interface LocalShift extends Pick<Shift, "name" | "from" | "to"> {
  id: string | `_${string}`;
  name: string;
}

/**
 * Tag that may not have been updated to the server yet. If `id` is undefined,
 * then the tag has not been uploaded to the server
 */
interface LocalTag extends Pick<Tag, "name"> {
  id?: Tag["id"];
}

interface LogbookForm extends Pick<LogbookWithAuth, "id" | "name"> {
  tags: LocalTag[];
  shifts: LocalShift[];
  authorizations: LocalAuthorization[];
}

function isOverlapping(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
) {
  if (start1 > end1) {
    if (start2 > end2) {
      return true;
    }

    return isOverlapping(start2, end2, start1, end1);
  }

  if (start2 > end2) {
    return start2 < end1 || end2 > start1;
  }

  return start2 < end1 && end2 > start1;
}

export function validateLogbookForm(form: LogbookForm) {
  const invalid: Set<
    | "name"
    | `shiftName/${string}`
    | `shiftFrom/${string}`
    | `shiftTo/${string}`
    | "shiftOverlap"
  > = new Set();

  if (!form.name) {
    invalid.add("name");
  }

  let invalidShiftTimes = false;

  form.shifts.forEach((shift) => {
    if (!shift.name) {
      invalid.add(`shiftName/${shift.id}`);
    }

    if (!shift.from) {
      invalidShiftTimes = true;
      invalid.add(`shiftFrom/${shift.id}`);
    }

    if (!shift.to) {
      invalidShiftTimes = true;
      invalid.add(`shiftTo/${shift.id}`);
    }
  });

  if (invalidShiftTimes) {
    return invalid;
  }

  form.shifts.forEach((shift1, i) => {
    form.shifts.forEach((shift2, j) => {
      if (i === j) {
        return;
      }

      if (
        isOverlapping(
          hhmmToMinutes(shift1.from),
          hhmmToMinutes(shift1.to),
          hhmmToMinutes(shift2.from),
          hhmmToMinutes(shift2.to),
        )
      ) {
        invalid.add("shiftOverlap");
      }
    });
  });

  return invalid;
}

export const useLogbookFormsStore = createAdminFormsStore<LogbookForm>();

/**
 * Converts date to its UTC yyyy-mm-dd format
 */
export default function dateToDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

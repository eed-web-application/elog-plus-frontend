export default function dateToDatetimeString(date: Date) {
  const offset = date.getTimezoneOffset();

  date = new Date(date.getTime() - offset * 60 * 1000);
  return date.toISOString().slice(0, -1);
}

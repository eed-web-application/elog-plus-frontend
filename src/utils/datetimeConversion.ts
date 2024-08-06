export function dateToDatetimeString(date: Date) {
  const offset = date.getTimezoneOffset();

  date = new Date(date.getTime() - offset * 60 * 1000);
  return date.toISOString().slice(0, -1);
}

export function hhmmToMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map((v) => parseInt(v, 10));
  return hour * 60 + minute;
}

export function utcToLocal(utcTime: string): string {
  const [hour, minute] = utcTime.split(":").map((v) => parseInt(v, 10));

  const now = new Date();
  now.setUTCHours(hour);
  now.setUTCMinutes(minute);

  const date = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (date.split(":")[0] === "24") {
    return `00:${date.split(":")[1]}`;
  }
  return date;
}

export function localToUtc(localTime: string): string {
  return new Date(`${new Date().toISOString().split("T")[0]}T${localTime}`)
    .toISOString()
    .split("T")[1]
    .slice(0, 5);
}

export function dateToYYYYMMDD(date: Date): string {
  const offset = date.getTimezoneOffset();
  date = new Date(date.getTime() - offset * 60 * 1000);

  return date.toISOString().split("T")[0];
}

export function yyyymmddToDate(yyyymmdd: string): Date {
  const offset = new Date(Date.parse(yyyymmdd)).getTimezoneOffset();
  const date = new Date(Date.parse(yyyymmdd) + offset * 60 * 1000);

  return date;
}

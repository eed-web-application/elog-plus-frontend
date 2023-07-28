export function utcToLocal(utcTime: string) {
  const [hour, minute] = utcTime.split(":").map((v) => parseInt(v, 10));

  const now = new Date();
  now.setUTCHours(hour);
  now.setUTCMinutes(minute);

  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function localToUtc(localTime: string) {
  return new Date(`${new Date().toISOString().split("T")[0]}T${localTime}Z`)
    .toISOString()
    .split("T")[1]
    .slice(0, 5);
}

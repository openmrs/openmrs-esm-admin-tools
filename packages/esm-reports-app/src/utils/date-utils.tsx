export function getStartOfToday(now?: Date) {
  let today = now ? now : new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

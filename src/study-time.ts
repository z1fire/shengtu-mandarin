export function splitStudyTime(seconds: number) {
  const totalMinutes = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) / 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// Fixed rubric reads fixture labels and arm outputs; it does not call product rules.
export const RUBRIC_VERSION = "1";
export function scoreCase(expectedSignal, relevantAskIds, output) {
  const predicted = new Set(output.signals);
  const missedDecisive = expectedSignal ? !predicted.has(expectedSignal) : false;
  const falseAlarm = expectedSignal === null ? predicted.size > 0 : [...predicted].some((signal) => signal !== expectedSignal);
  const relevantQuestions = (output.questionIds ?? []).filter((id) => relevantAskIds.includes(id)).length;
  const harmfulRevision = expectedSignal === null && output.action !== "stay-quiet" && output.action !== "continue";
  return { missedDecisive, falseAlarm, relevantQuestions, harmfulRevision };
}

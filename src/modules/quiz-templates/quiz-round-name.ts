/** Отображаемое название раунда: кастомное или «Раунд N». */
export function resolveQuizRoundName(
  customName: string | null | undefined,
  order: number,
): string {
  const trimmed = customName?.trim();
  return trimmed ? trimmed : `Раунд ${order}`;
}

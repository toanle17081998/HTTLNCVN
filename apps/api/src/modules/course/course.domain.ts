import type { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

function normalizeAnswer(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isAnswerCorrect(
  studentAnswer: string,
  rightAnswer: string | null,
  type: string,
  logicConfig?: Prisma.JsonValue,
): boolean {
  if (!studentAnswer.trim()) return false;
  const normalizedStudent = normalizeAnswer(studentAnswer);
  const config = logicConfig as { answers?: Array<{ text?: string; value?: string; is_correct?: boolean }> };
  if (Array.isArray(config?.answers) && config.answers.length > 0) {
    return config.answers
      .filter((answer) => answer.is_correct)
      .some((answer) =>
        Boolean(
          (answer.value && normalizeAnswer(answer.value) === normalizedStudent) ||
          (answer.text && normalizeAnswer(answer.text) === normalizedStudent),
        ),
      );
  }
  if (!rightAnswer?.trim()) return false;
  if (type !== 'multiple_choices') return normalizedStudent === normalizeAnswer(rightAnswer);
  const normalizeList = (value: string | null) =>
    String(value ?? '').split(',').map(normalizeAnswer).filter(Boolean).sort().join('|');
  return normalizeList(studentAnswer) === normalizeList(rightAnswer);
}

export function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

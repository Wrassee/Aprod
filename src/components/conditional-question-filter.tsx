import { useMemo } from 'react';
import { Question, AnswerValue } from '@shared/schema';

export interface ConditionalFilterHookResult {
  filteredQuestions: Question[];
  activeConditions: string[];
  totalQuestions: number;
  filteredCount: number;
}

/**
 * Hook for dynamic question filtering based on True/False conditions
 * @param allQuestions - All available questions from the template
 * @param answers - Current form answers
 * @returns Filtered questions and filter statistics
 */
export function useConditionalQuestionFilter(
  allQuestions: Question[],
  answers: Record<string, AnswerValue>
): ConditionalFilterHookResult {

  return useMemo(() => {
    // 1. Lépés: Keressük meg azokat a kérdéseket, amik más csoportokat vezérelhetnek
    const controllingQuestions = allQuestions.filter(
      q => q.conditional_group_key && (q.type === 'radio' || q.type === 'checkbox' || q.type === 'true_false')
    );

    // 2. Lépés: Határozzuk meg az aktív feltételes kulcsokat
    const activeConditionKeys: string[] = [];

    controllingQuestions.forEach(question => {
      // JAVÍTÁS: A választ MINDIG a kérdés saját ID-ja alatt keressük!
      const answer = answers[question.id];

      // =================== DEBUG LOG ===================
      console.log('--- FILTER DEBUG ---', {
        questionId: question.id,
        conditional_group_key: question.conditional_group_key,
        allAnswerKeys: Object.keys(answers),
        foundAnswer: answer,
      });
      // =================================================

      // Értékeljük ki a választ
      const normalizedAnswer = String(answer).toLowerCase().trim();
      const truthyValues = ['true', 'igen', 'yes', 'ja', '1', 'x'];

      if (truthyValues.includes(normalizedAnswer) || answer === true) {
        // Ha a válasz "igaz", akkor a conditional_group_key-t tesszük az aktív listába
        if (question.conditional_group_key) {
          activeConditionKeys.push(question.conditional_group_key);
        }
      }
    });

    // 3. Lépés: Gyűjtsük össze az ÖSSZES feltételes kulcsokat
    // FIXED: Használjuk a conditional_group_key értékeket (stable slugs)
    const allConditionalKeys = new Set(
      controllingQuestions
        .map(q => q.conditional_group_key) // Ez adja meg, mely groupKey-ek feltételesek
        .filter(Boolean) as string[]
    );

    // 4. Lépés: Szűrjük a kérdéseket
    const filteredQuestions = allQuestions.filter(question => {
      // A vezérlő kérdések (amiknek van conditional_group_key-jük) mindig látszanak
      if (question.conditional_group_key) {
        return true;
      }

      // Ha egy kérdésnek nincs groupKey-je, mindig látszik
      if (!question.groupKey) {
        return true;
      }

      // Ha a kérdés csoportja NEM tartozik a feltételes kulcsok közé, mindig látszik
      if (!allConditionalKeys.has(question.groupKey)) {
        return true;
      }

      // Ha a kérdés feltételes csoportba tartozik, csak akkor látszik, ha a feltétel aktív
      return activeConditionKeys.includes(question.groupKey);
    });

    console.log('🎯 ConditionalQuestionFilter:', {
      totalQuestions: allQuestions.length,
      filteredCount: filteredQuestions.length,
      activeConditions: activeConditionKeys.length,
      activeConditionKeys,
      allConditionalKeys: Array.from(allConditionalKeys),
    });

    return {
      filteredQuestions,
      activeConditions: activeConditionKeys,
      totalQuestions: allQuestions.length,
      filteredCount: filteredQuestions.length,
    };

  }, [allQuestions, answers]);
}

/**
 * Utility function to check if a question group should be visible
 * @param groupName - The group name to check
 * @param activeConditions - Array of currently active condition keys
 * @param allConditionalGroups - Set of all conditional group names
 * @returns boolean indicating if the group should be visible
 */
export function isQuestionGroupVisible(
  groupName: string | undefined,
  activeConditions: string[],
  allConditionalGroups: Set<string>
): boolean {
  if (!groupName) {
    return true; // Always show questions without group name
  }

  // If the group is not conditional, always show it
  if (!allConditionalGroups.has(groupName)) {
    return true;
  }

  // If the group is conditional, only show if it's active
  return activeConditions.includes(groupName);
}

/**
 * Generate "n.a." answers for disabled question groups
 * @param disabledQuestions - Questions that are filtered out
 * @returns Record of question IDs mapped to "n.a." values
 */
export function generateDisabledAnswers(disabledQuestions: Question[]): Record<string, AnswerValue> {
  const disabledAnswers: Record<string, AnswerValue> = {};

  disabledQuestions.forEach(question => {
    // Use id as the primary key for answers
    const answerKey = question.id;
    disabledAnswers[answerKey] = 'n.a.';
  });

  return disabledAnswers;
}

/**
 * Update answers by setting disabled questions to "n.a."
 * @param currentAnswers - Current form answers
 * @param allQuestions - All questions from template
 * @param filteredQuestions - Currently visible questions
 * @returns Updated answers with "n.a." for disabled questions
 */
export function updateAnswersWithDisabled(
  currentAnswers: Record<string, AnswerValue>,
  allQuestions: Question[],
  filteredQuestions: Question[]
): Record<string, AnswerValue> {
  // Use id for consistent comparison
  const filteredIds = new Set(filteredQuestions.map(q => q.id));
  const disabledQuestions = allQuestions.filter(q => !filteredIds.has(q.id));

  const disabledAnswers: Record<string, AnswerValue> = {};
  disabledQuestions.forEach(q => {
    // Csak akkor írjuk felül "n.a."-ra, ha NEM vezérlő kérdés
    // A vezérlő kérdéseknek mindig megmarad az eredeti válaszuk
    if (!q.conditional_group_key) {
      const currentValue = currentAnswers[q.id];
      // ONLY set "n.a." if the field is empty or undefined
      // Keep existing user-entered data intact
      if (!currentValue || currentValue === '') {
        disabledAnswers[q.id] = 'n.a.';
      }
    }
  });

  return {
    ...currentAnswers,
    ...disabledAnswers
  };
}
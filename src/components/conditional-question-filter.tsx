import { useMemo } from 'react';
import { Question } from '../../shared/schema';

type AnswerValue = string | number | boolean;

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
    // Step 1: Find all True/False questions that control conditional groups
    const trueFalseQuestions = allQuestions.filter(q => 
      q.type === 'radio' || q.type === 'checkbox'
    );
    
    // Step 2: Determine which conditional group keys are active (answered as true)
    const activeConditions: string[] = [];
    
    trueFalseQuestions.forEach(question => {
      // Use question_id (external ID) instead of question.id (UUID)
      const answer = answers[question.question_id || question.id];
      
      // Robust truth value detection with normalization
      const normalizedAnswer = String(answer).toLowerCase().trim();
      const truthyValues = ['true', 'igen', 'yes', 'ja', '1', 'ok', 'valid', 'megfelelő'];
      const isTruthy = truthyValues.includes(normalizedAnswer) || answer === true;
      
      if (isTruthy) {
        // Use the question_id as the conditional group key
        activeConditions.push(question.question_id || question.id);
      }
    });
    
    // Step 3: Filter questions based on conditional group keys
    const filteredQuestions = allQuestions.filter(question => {
      // If the question has no conditional group key, always include it
      if (!question.conditional_group_key) {
        return true;
      }
      
      // Include the question only if its conditional group key is active
      return activeConditions.includes(question.conditional_group_key);
    });
    
    console.log('🎯 ConditionalQuestionFilter:', {
      totalQuestions: allQuestions.length,
      filteredCount: filteredQuestions.length,
      activeConditions: activeConditions.length,
      activeConditionKeys: activeConditions
    });
    
    return {
      filteredQuestions,
      activeConditions,
      totalQuestions: allQuestions.length,
      filteredCount: filteredQuestions.length
    };
    
  }, [allQuestions, answers]);
}

/**
 * Utility function to check if a question group should be visible
 * @param conditional_group_key - The group key to check
 * @param activeConditions - Array of currently active condition keys
 * @returns boolean indicating if the group should be visible
 */
export function isQuestionGroupVisible(
  conditional_group_key: string | undefined,
  activeConditions: string[]
): boolean {
  if (!conditional_group_key) {
    return true; // Always show questions without conditional logic
  }
  
  return activeConditions.includes(conditional_group_key);
}

/**
 * Generate "n.a." answers for disabled question groups
 * @param disabledQuestions - Questions that are filtered out
 * @returns Record of question IDs mapped to "n.a." values
 */
export function generateDisabledAnswers(disabledQuestions: Question[]): Record<string, AnswerValue> {
  const disabledAnswers: Record<string, AnswerValue> = {};
  
  disabledQuestions.forEach(question => {
    // Use question_id (external ID) for answer keys
    const answerKey = question.question_id || question.id;
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
  // Use question_id for consistent comparison
  const filteredIds = new Set(filteredQuestions.map(q => q.question_id || q.id));
  const disabledQuestions = allQuestions.filter(q => !filteredIds.has(q.question_id || q.id));
  const disabledAnswers = generateDisabledAnswers(disabledQuestions);
  
  return {
    ...currentAnswers,
    ...disabledAnswers
  };
}
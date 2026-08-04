import { supabase } from './supabase';

const MAX_DIALOGUE_MESSAGES = 6;

function compactProfile(profile = {}) {
  return {
    display_name: String(profile.display_name || '').slice(0, 80),
    primary_goal: String(profile.primary_goal || '').slice(0, 240),
    schedule_type: String(profile.schedule_type || '').slice(0, 80),
    preferred_session_minutes: Number(profile.preferred_session_minutes || 30),
    programming_level: Number(profile.subject_levels?.programming || 0),
    learning_preferences: profile.learning_preferences || {}
  };
}

function compactDialogue(messages = []) {
  return messages.slice(-MAX_DIALOGUE_MESSAGES).map((message) => ({
    role: message.role === 'student' ? 'student' : 'tutor',
    content: String(message.content || '').slice(0, 900)
  }));
}

export async function requestTutorReply({
  enabled,
  fallbackMessage,
  mode,
  subject = 'programming',
  topic,
  phase,
  objectiveVerdict,
  studentAnswer,
  question,
  deterministicFeedback,
  deterministicHint,
  codeError,
  failedTests = [],
  hintLevel = 0,
  attempt = 1,
  energy = 5,
  availableMinutes = 30,
  profile,
  messages,
  revealSolutionAllowed = false,
  forbiddenFragments = []
}) {
  if (!enabled) {
    return {
      enabled: false,
      fallback: true,
      reason: 'AI_DISABLED_FOR_DEMO',
      provider: 'scenario',
      model: null,
      message: fallbackMessage
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('tutor-ai', {
      body: {
        fallback_message: fallbackMessage,
        mode,
        subject,
        topic,
        phase,
        objective_verdict: objectiveVerdict,
        student_answer: String(studentAnswer || '').slice(0, 2500),
        question: String(question || '').slice(0, 2500),
        deterministic_feedback: String(deterministicFeedback || '').slice(0, 1800),
        deterministic_hint: String(deterministicHint || '').slice(0, 1200),
        code_error: String(codeError || '').slice(0, 1600),
        failed_tests: failedTests.slice(0, 12),
        hint_level: hintLevel,
        attempt,
        energy,
        available_minutes: availableMinutes,
        student_profile: compactProfile(profile),
        recent_dialogue: compactDialogue(messages),
        reveal_solution_allowed: revealSolutionAllowed,
        forbidden_fragments: forbiddenFragments
      }
    });

    if (error || !data?.message) {
      return {
        enabled: false,
        fallback: true,
        reason: error?.message || 'AI_FUNCTION_ERROR',
        provider: 'scenario',
        model: null,
        message: fallbackMessage
      };
    }

    return data;
  } catch (error) {
    return {
      enabled: false,
      fallback: true,
      reason: error?.message || 'AI_NETWORK_ERROR',
      provider: 'scenario',
      model: null,
      message: fallbackMessage
    };
  }
}

import type { RecruiterBehaviorDecision } from "@/lib/recruiterBehaviorEngine";
import type { RecruiterState } from "@/lib/recruiterStateEngine";

export type TavusVisualState = {
  mood: "neutral" | "warm" | "listening" | "thinking" | "skeptical" | "challenging" | "impressed" | "disengaged";
  speakingPace: "slow" | "normal" | "fast";
  turnStyle: "supportive" | "analytical" | "direct" | "interruptive";
  shouldInterrupt: boolean;
  interruptionMessage?: string;
  visualCue: string;
};

export function getTavusVisualState(input: {
  recruiterState: RecruiterState;
  decision?: RecruiterBehaviorDecision;
}): TavusVisualState {
  const { recruiterState, decision } = input;

  if (decision?.shouldInterrupt) {
    return {
      mood: "challenging",
      speakingPace: "fast",
      turnStyle: "interruptive",
      shouldInterrupt: true,
      interruptionMessage: decision.interruptionMessage,
      visualCue: "Cut in politely, reduce warmth, and ask for a direct answer.",
    };
  }

  switch (recruiterState.mood) {
    case "impressed":
      return { mood: "impressed", speakingPace: "normal", turnStyle: "analytical", shouldInterrupt: false, visualCue: "Slightly warmer expression. Ask a deeper follow-up." };
    case "impatient":
      return { mood: "challenging", speakingPace: "fast", turnStyle: "direct", shouldInterrupt: false, visualCue: "Shorter tone. Less warmth. Ask for specifics." };
    case "skeptical":
      return { mood: "skeptical", speakingPace: "normal", turnStyle: "direct", shouldInterrupt: false, visualCue: "Skeptical expression. Probe for evidence." };
    case "disengaged":
      return { mood: "disengaged", speakingPace: "slow", turnStyle: "direct", shouldInterrupt: false, visualCue: "Low enthusiasm. Ask one final direct follow-up." };
    case "warm":
      return { mood: "warm", speakingPace: "normal", turnStyle: "supportive", shouldInterrupt: false, visualCue: "Calm expression. Encourage clarity." };
    case "analytical":
      return { mood: "thinking", speakingPace: "normal", turnStyle: "analytical", shouldInterrupt: false, visualCue: "Thoughtful pause. Ask structured follow-up." };
    default:
      return { mood: "listening", speakingPace: "normal", turnStyle: "analytical", shouldInterrupt: false, visualCue: "Attentive listening. Ask one focused question." };
  }
}

export function buildTavusContextInstruction(state: TavusVisualState) {
  return [
    `Visual recruiter mood: ${state.mood}`,
    `Speaking pace: ${state.speakingPace}`,
    `Turn style: ${state.turnStyle}`,
    `Visual cue: ${state.visualCue}`,
    state.shouldInterrupt && state.interruptionMessage ? `If interrupting, say: "${state.interruptionMessage}"` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

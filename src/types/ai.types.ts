export type AIEndpointType =
  | "PRIORITIZE"
  | "ESTIMATE"
  | "DESCRIBE"
  | "DETECT_BLOCKER"
  | "ASSIGN";

export interface AIStreamChunk {
  text: string;
}

export interface AIStreamDone {
  done: true;
  logId: string;
}

export interface AISuggestion {
  logId: string;
  type: AIEndpointType;
  reasoning: string;
  result: string | number | boolean;
  confidence: number;
}

export interface AIFeedbackPayload {
  logId: string;
  feedback: "USEFUL" | "NOT_USEFUL";
}

export interface AskAdamMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskAdamRequest {
  question: string;
  /**
   * Prior turns in the conversation, oldest first. Optional today; the
   * frontend already threads this through so history can be enabled
   * without a breaking change once /api/ask-adam supports it.
   */
  history?: AskAdamMessage[];
}

export interface AskAdamResponse {
  answer: string;
}

export interface AskAdamErrorResponse {
  error: string;
}

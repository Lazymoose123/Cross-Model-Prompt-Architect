
export enum ModelTarget {
  GEMINI = 'GEMINI',
  GPT4 = 'GPT4',
  CLAUDE = 'CLAUDE',
  GENERAL = 'GENERAL'
}

export interface PromptResult {
  optimizedPrompt: string;
  logic: string;
  modelTip: string;
  clarifyingQuestions?: string[];
  isClarificationNeeded: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: PromptResult;
  timestamp: number;
}

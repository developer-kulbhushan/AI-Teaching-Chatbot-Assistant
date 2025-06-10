export type AgentSource = 'user' | 'course_outline_agent' | 'quiz_agent' | 'topic_explainer';

export interface Message {
  source: AgentSource;
  content: string;
  timestamp: string;
  isSubmitted?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastUpdated: string;
}

export interface ConversationResponse {
  conversation: [string, string][];
}

export interface ConversationHistory {
  messages: Message[];
}

export interface QuizContent {
  header: string;
  quiz: QuizQuestion[];
  footer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
}
import React from 'react';
import { Message } from '../types/chat';
import { UserMessage } from './messages/UserMessage';
import { QuizMessage } from './messages/QuizMessage';
import { AgentMessage } from './messages/AgentMessage';

interface ChatMessageProps {
  message: Message;
  onQuizSubmit?: (answers: string) => void;
}

export function ChatMessage({ message, onQuizSubmit }: ChatMessageProps) {
  const renderMessage = () => {
    if (message.source === 'user') {
      return <UserMessage message={message} />;
    }
    
    if (message.source === 'quiz_agent') {
      return <QuizMessage message={message} onQuizSubmit={onQuizSubmit} />;
    }
    
    return <AgentMessage message={message} />;
  };

  return (
    <div className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex items-start max-w-[80%]">
        {renderMessage()}
      </div>
    </div>
  );
}
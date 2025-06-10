import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, BrainCircuit } from 'lucide-react';
import { Message } from '../../types/chat';
import { MessageMarkdownComponents } from './MessageMarkdownComponents';

interface AgentMessageProps {
  message: Message;
}

export function AgentMessage({ message }: AgentMessageProps) {
  const time = new Date(message.timestamp).toLocaleTimeString();

  const getMessageStyle = () => {
    switch (message.source) {
      case 'course_outline_agent':
        return 'bg-purple-100 text-gray-800 rounded-bl-none border-l-4 border-purple-500';
      case 'topic_explainer':
        return 'bg-yellow-100 text-gray-800 rounded-bl-none border-l-4 border-yellow-500';
      default:
        return 'bg-gray-200 text-gray-800 rounded-bl-none';
    }
  };

  const getTimeStyle = () => {
    switch (message.source) {
      case 'course_outline_agent':
        return 'text-purple-500';
      case 'topic_explainer':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  const getAgentIcon = () => {
    switch (message.source) {
      case 'course_outline_agent':
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'topic_explainer':
        return <BrainCircuit className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-lg px-4 py-2 ${getMessageStyle()}`}>
      <ReactMarkdown 
        className="prose prose-sm max-w-none"
        components={MessageMarkdownComponents}
      >
        {message.content}
      </ReactMarkdown>
      <p className={`text-xs mt-1 ${getTimeStyle()}`}>
        {time}
      </p>
    </div>
  );
}
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/chat';
import { MessageMarkdownComponents } from './MessageMarkdownComponents';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  const time = new Date(message.timestamp).toLocaleTimeString();

  return (
    <div className="bg-blue-500 text-white rounded-lg rounded-br-none px-4 py-2">
      <ReactMarkdown 
        className="prose prose-sm max-w-none prose-invert"
        components={MessageMarkdownComponents}
      >
        {message.content}
      </ReactMarkdown>
      <p className="text-xs mt-1 text-blue-100">
        {time}
      </p>
    </div>
  );
}
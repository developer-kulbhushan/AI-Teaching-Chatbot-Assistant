import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, GraduationCap } from 'lucide-react';
import { Message } from '../../types/chat';
import { MessageMarkdownComponents } from './MessageMarkdownComponents';

interface QuizMessageProps {
  message: Message;
  onQuizSubmit?: (answers: string) => void;
}

export function QuizMessage({ message, onQuizSubmit }: QuizMessageProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const time = new Date(message.timestamp).toLocaleTimeString();

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (message.isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleQuizSubmit = () => {
    if (!onQuizSubmit || message.isSubmitted) return;
    
    const answers = Object.entries(selectedAnswers)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([index, answer]) => `${parseInt(index) + 1}. ${answer}`)
      .join(', ');
    
    onQuizSubmit(answers);
  };

  return (
    <div className="bg-green-100 text-gray-800 rounded-lg rounded-bl-none border-l-4 border-green-500 px-4 py-2">
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown components={MessageMarkdownComponents}>
          {message.content}
        </ReactMarkdown>
      </div>
      <p className="text-xs mt-1 text-green-500">
        {time}
      </p>
    </div>
  );
}
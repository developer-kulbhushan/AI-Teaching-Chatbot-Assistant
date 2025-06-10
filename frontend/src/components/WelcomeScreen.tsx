import React, { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStartConversation: (message: string) => void;
}

const suggestedQuestions = [
  "What is Object-Oriented Programming?",
  "Explain the basics of Machine Learning",
  "How do web browsers work?",
];

export function WelcomeScreen({ onStartConversation }: WelcomeScreenProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onStartConversation(inputValue.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <MessageCircle className="w-16 h-16 text-blue-500" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Ready to Learn Something New?
          </h1>
          <p className="text-gray-600 text-lg">
            Ask any question or explore our suggested topics
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question here..."
              className="w-full p-6 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-lg transition-all shadow-sm hover:shadow-md"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Ask
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Popular Topics
          </h2>
          <div className="grid gap-4">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onStartConversation(question)}
                className="p-6 text-left bg-white border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-blue-500 mr-3 group-hover:text-blue-600" />
                  <p className="text-gray-800 text-lg group-hover:text-blue-600">{question}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
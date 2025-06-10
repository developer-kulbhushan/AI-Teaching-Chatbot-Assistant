import React from 'react';
import { PlusCircle, MessageCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  isOpen: boolean;
  currentConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onToggle: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function Sidebar({
  conversations,
  isOpen,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onToggle,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          aria-label="Open sidebar"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ${
          isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={onNewConversation}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <PlusCircle size={20} className="mr-2" />
              New Chat
            </button>
            <button
              onClick={onToggle}
              className="ml-2 p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative hover:bg-gray-100 ${
                  currentConversationId === conversation.id ? 'bg-blue-100' : ''
                }`}
              >
                <button
                  onClick={() => onConversationSelect(conversation.id)}
                  className="w-full p-3 flex items-center text-left"
                >
                  <MessageCircle size={20} className="mr-3 text-gray-500" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm">{conversation.title}</p>
                    <p className="text-xs text-gray-500">
                      {conversation.lastUpdated}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all duration-200"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
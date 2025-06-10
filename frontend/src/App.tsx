import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Message, Conversation } from './types/chat';
import { startConversation, sendMessage, fetchConversations, loadConversation, deleteConversation } from './api/chat';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationCache = useRef<Map<string, Message[]>>(new Map());
  const loadingConversationId = useRef<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    const fetchedConversations = await fetchConversations();
    setConversations(fetchedConversations);
  }

  async function handleConversationSelect(conversationId: string) {
    setCurrentConversationId(conversationId);
    
    if (conversationCache.current.has(conversationId)) {
      setMessages(conversationCache.current.get(conversationId) || []);
    } else {
      const messages = await loadConversation(conversationId);
      conversationCache.current.set(conversationId, messages);
      setMessages(messages);
    }
    
    setIsFirstMessage(false);
  }

  function handleNewConversation() {
    setCurrentConversationId(null);
    setMessages([]);
    setIsFirstMessage(true);
  }

  async function handleDeleteConversation(conversationId: string) {
    try {
      await deleteConversation(conversationId);
      
      if (conversationId === currentConversationId) {
        handleNewConversation();
      }
      
      conversationCache.current.delete(conversationId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }

  async function handleQuizSubmit(answers: string) {
    if (!currentConversationId || isLoading) return;

    try {
      setIsLoading(true);
      loadingConversationId.current = currentConversationId;
      
      // Mark the quiz message as submitted
      setMessages(prev => prev.map(msg => 
        msg.source === 'quiz_agent' ? { ...msg, isSubmitted: true } : msg
      ));
      
      // Send the quiz answers
      const userMessage: Message = {
        source: 'user',
        content: answers,
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      const responseMessages = await sendMessage(answers, currentConversationId);
      
      if (currentConversationId === loadingConversationId.current) {
        const finalMessages = [...updatedMessages, ...responseMessages];
        setMessages(finalMessages);
        
        conversationCache.current.set(currentConversationId, finalMessages);
        await loadConversations();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      if (currentConversationId === loadingConversationId.current) {
        setIsLoading(false);
      }
      loadingConversationId.current = null;
    }
  }

  async function handleStartConversation(message: string) {
    try {
      setIsLoading(true);
      setError(null);
      
      const userMessage: Message = {
        source: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages([userMessage]);
      
      const response = await startConversation(message);
      const newMessages = [userMessage, ...response.messages];
      setMessages(newMessages);
      setIsFirstMessage(false);
      
      setCurrentConversationId(response.conversationId);
      conversationCache.current.set(response.conversationId, newMessages);
      
      await loadConversations();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      loadingConversationId.current = currentConversationId;
      setError(null);
      
      const userMessage: Message = {
        source: 'user',
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setNewMessage('');
      
      const responseMessages = await sendMessage(newMessage, currentConversationId!);
      
      if (currentConversationId === loadingConversationId.current) {
        const finalMessages = [...updatedMessages, ...responseMessages];
        setMessages(finalMessages);
        
        if (currentConversationId) {
          conversationCache.current.set(currentConversationId, finalMessages);
        }
        
        await loadConversations();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      if (currentConversationId === loadingConversationId.current) {
        setIsLoading(false);
      }
      loadingConversationId.current = null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        conversations={conversations}
        isOpen={isSidebarOpen}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onDeleteConversation={handleDeleteConversation}
      />
      
      <div className={`flex-1 flex flex-col transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white shadow-sm py-4">
          <div className="container mx-auto px-4 flex items-center">
            <MessageCircle className="w-6 h-6 text-blue-500 mr-2" />
            <h1 className="text-xl font-semibold text-gray-800">AI Teaching Assistant</h1>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 flex flex-col">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {currentConversationId === null && messages.length === 0 ? (
            <WelcomeScreen onStartConversation={handleStartConversation} />
          ) : (
            <>
              <div className="flex-1 bg-white rounded-lg shadow-sm p-4 overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={index} 
                    message={message} 
                    onQuizSubmit={message.source === 'quiz_agent' ? handleQuizSubmit : undefined}
                  />
                ))}
                {isLoading && currentConversationId === loadingConversationId.current && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <div className="animate-bounce mr-2">●</div>
                    <div className="animate-bounce mr-2 animation-delay-200">●</div>
                    <div className="animate-bounce animation-delay-400">●</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
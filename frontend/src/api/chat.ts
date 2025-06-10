const API_BASE_URL = 'http://localhost:8000';

interface StartConversationResponse {
  conversation_id: string;
  conversation: [string, string][];
}

async function makeRequest(url: string, body: any, retries = 5): Promise<Message[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data: ConversationResponse = await response.json();
      
      if (data.conversation.length === 0 && attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      if (data.conversation.length === 0 && attempt === retries - 1) {
        return [{
          source: 'course_outline_agent',
          content: "I apologize, but I'm having trouble processing your request at the moment. Please try again or rephrase your question.",
          timestamp: new Date().toISOString(),
        }];
      }
      
      return data.conversation.map(([source, content]) => ({
        source: source as AgentSource,
        content,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      if (attempt === retries - 1) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to chat server. Please ensure the backend is running.');
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to get a response after multiple attempts');
}

export async function startConversation(message: string): Promise<{ messages: Message[], conversationId: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/start_conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data: StartConversationResponse = await response.json();
    
    const messages = data.conversation.map(([source, content]) => ({
      source: source as AgentSource,
      content,
      timestamp: new Date().toISOString(),
    }));

    return {
      messages,
      conversationId: data.conversation_id,
    };
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
}

export async function sendMessage(message: string, conversationId: string): Promise<Message[]> {
  return makeRequest(`${API_BASE_URL}/send_message`, { message, conversation_id: conversationId });
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch_conversations`);
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    const data = await response.json();
    return data.conversations.map(([id, title, lastUpdated]: [string, string, string]) => ({
      id,
      title,
      lastUpdated,
    }));
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete_conversation`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
}

export async function loadConversation(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/load_conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data: ConversationResponse = await response.json();
    return data.conversation.map(([source, content]) => ({
      source: source as AgentSource,
      content,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to load conversation:', error);
    return [];
  }
}
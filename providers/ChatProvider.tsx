import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { ChatSession, ChatMessage, MonumentContext, sendChatMessage, generateChatTitle } from "@/services/aiChatService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_CHAT_SESSIONS = 10; // Reduced for local storage
const MAX_MESSAGES_PER_SESSION = 50;
const CHAT_STORAGE_KEY = "@monument_scanner_chat_sessions";

export const [ChatProvider, useChat] = createContextHook(() => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      console.log('Loading chat sessions from local storage...');
      
      const storedSessions = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      
      if (storedSessions) {
        try {
          const sessionsData = JSON.parse(storedSessions);
          const sessionsWithDates = sessionsData.map((session: any) => {
            try {
              return {
                id: session.id || '',
                title: session.title || 'New Chat',
                messages: Array.isArray(session.messages) ? session.messages : [],
                createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
                lastUpdated: session.lastUpdated ? new Date(session.lastUpdated) : new Date(),
                monumentId: session.monumentId || undefined,
              };
            } catch (mappingError) {
              console.error('Error mapping chat session:', mappingError, session);
              return null;
            }
          }).filter(Boolean) as ChatSession[];
          
          setSessions(sessionsWithDates);
          
          // Set the most recent session as current
          if (sessionsWithDates.length > 0) {
            setCurrentSessionId(sessionsWithDates[0].id);
          }
          
          console.log(`✅ Loaded ${sessionsWithDates.length} chat sessions from local storage`);
        } catch (parseError) {
          console.error('Error parsing stored chat sessions:', parseError);
          setSessions([]);
        }
      } else {
        console.log('No stored chat sessions found');
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading chat sessions from local storage:", error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

    const saveChatSessions = useCallback(async (newSessions: ChatSession[]) => {
    try {
      // Limit the number of sessions
      const sessionsToSave = newSessions.slice(0, MAX_CHAT_SESSIONS);

      // Save to local storage
      const sessionsData = sessionsToSave.map(session => ({
        id: session.id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt.toISOString(),
        lastUpdated: session.lastUpdated.toISOString(),
        monumentId: session.monumentId
      }));

      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessionsData));
      console.log(`✅ Saved ${sessionsToSave.length} chat sessions to local storage`);

      return sessionsToSave;
    } catch (error) {
      console.error("Error saving chat sessions to local storage:", error);
      throw error;
    }
  }, []);

  const createNewSession = useCallback(async (
    title?: string,
    monumentContext?: MonumentContext
  ): Promise<string> => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: title || "New Chat",
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
      monumentId: monumentContext?.id
    };

    const newSessions = [newSession, ...sessions];
    await saveChatSessions(newSessions);
    setSessions(newSessions);
    setCurrentSessionId(newSession.id);
    
    return newSession.id;
  }, [sessions, saveChatSessions]);

  const sendMessage = useCallback(async (
    content: string,
    sessionId?: string,
    monumentContext?: MonumentContext
  ): Promise<void> => {
    let targetSessionId = sessionId || currentSessionId;
    
    setIsSending(true);
    
    try {
      // Find the current session or create one if it doesn't exist
      let sessionIndex = sessions.findIndex(s => s.id === targetSessionId);
      
      if (sessionIndex === -1 || !targetSessionId) {
        // Create a new session if none exists
        console.log('Creating new session for message');
        targetSessionId = await createNewSession(undefined, monumentContext);
        // Refresh sessions to get the new one
        const newSessions = [{
          id: targetSessionId,
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          lastUpdated: new Date(),
          monumentId: monumentContext?.id
        }, ...sessions];
        setSessions(newSessions);
        sessionIndex = 0;
      }

      const session = sessions[sessionIndex] || {
        id: targetSessionId!,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        monumentId: monumentContext?.id
      };
      
      // Create user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
        monumentId: monumentContext?.id
      };

      // Add user message to session
      const updatedMessages = [...session.messages, userMessage];
      
      // Limit messages per session
      if (updatedMessages.length > MAX_MESSAGES_PER_SESSION) {
        updatedMessages.splice(0, updatedMessages.length - MAX_MESSAGES_PER_SESSION);
      }

      // Update session with user message
      const updatedSession = {
        ...session,
        messages: updatedMessages,
        lastUpdated: new Date()
      };

      // Generate title for new sessions
      if (session.messages.length === 0) {
        try {
          const generatedTitle = await generateChatTitle(content, monumentContext);
          updatedSession.title = generatedTitle;
        } catch (error) {
          console.error('Error generating title:', error);
        }
      }

      // Update sessions array
      const newSessions = [...sessions];
      newSessions[sessionIndex] = updatedSession;
      setSessions(newSessions);

      // Get AI response
      const aiResponse = await sendChatMessage(content, monumentContext, updatedMessages);
      
      // Create AI message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        monumentId: monumentContext?.id
      };

      // Add AI message to session
      const finalMessages = [...updatedMessages, aiMessage];
      if (finalMessages.length > MAX_MESSAGES_PER_SESSION) {
        finalMessages.splice(0, finalMessages.length - MAX_MESSAGES_PER_SESSION);
      }

      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        lastUpdated: new Date()
      };

      // Update sessions array with AI response
      const finalSessions = [...sessions];
      finalSessions[sessionIndex] = finalSession;
      
      await saveChatSessions(finalSessions);
      setSessions(finalSessions);
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [sessions, currentSessionId, saveChatSessions, createNewSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      console.log('Deleting chat session from local storage:', sessionId);
      
      const newSessions = sessions.filter(s => s.id !== sessionId);
      await saveChatSessions(newSessions);
      setSessions(newSessions);
      
      // If we deleted the current session, set a new current session
      if (currentSessionId === sessionId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
      
      console.log('✅ Chat session deleted successfully');
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }, [sessions, currentSessionId, saveChatSessions]);

  const clearAllSessions = useCallback(async () => {
    try {
      console.log('Clearing all chat sessions from local storage');
      
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      setSessions([]);
      setCurrentSessionId(null);
      
      console.log('✅ All chat sessions cleared successfully');
    } catch (error) {
      console.error('Error clearing all chat sessions:', error);
    }
  }, []);

  const getCurrentSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  const contextValue = useMemo(() => ({
    sessions,
    currentSession: getCurrentSession,
    currentSessionId,
    isLoading,
    isSending,
    createNewSession,
    sendMessage,
    deleteSession,
    clearAllSessions,
    setCurrentSessionId,
  }), [
    sessions,
    getCurrentSession,
    currentSessionId,
    isLoading,
    isSending,
    createNewSession,
    sendMessage,
    deleteSession,
    clearAllSessions,
    setCurrentSessionId,
  ]);

  return contextValue;
});

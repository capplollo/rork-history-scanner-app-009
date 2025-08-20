import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { ChatSession, ChatMessage, MonumentContext, sendChatMessage, generateChatTitle } from "@/services/aiChatService";
import { supabase } from "@/lib/supabase";

const MAX_CHAT_SESSIONS = 20; // Increased since we're using Supabase
const MAX_MESSAGES_PER_SESSION = 50;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, using local storage fallback');
        setIsLoading(false);
        return;
      }

      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error loading chat sessions:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setIsLoading(false);
        return;
      }

      if (sessionsData) {
        const sessionsWithDates = sessionsData.map((session: any) => {
          try {
            return {
              id: session.id || '',
              title: session.title || 'New Chat',
              messages: Array.isArray(session.messages) ? session.messages : [],
              createdAt: session.created_at ? new Date(session.created_at) : new Date(),
              lastUpdated: session.last_updated ? new Date(session.last_updated) : new Date(),
              monumentId: session.monument_id || undefined,
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error loading chat sessions:", errorMessage);
      console.error("Full error details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatSessions = useCallback(async (newSessions: ChatSession[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot save to Supabase');
        return newSessions;
      }

      // Limit the number of sessions
      const sessionsToSave = newSessions.slice(0, MAX_CHAT_SESSIONS);
      
      // Upsert sessions to Supabase
      const { error } = await supabase
        .from('chat_sessions')
        .upsert(
          sessionsToSave.map(session => ({
            id: session.id,
            user_id: user.id,
            title: session.title,
            messages: session.messages,
            monument_id: session.monumentId,
            created_at: session.createdAt.toISOString(),
            last_updated: session.lastUpdated.toISOString()
          }))
        );

      if (error) {
        console.error('Error saving chat sessions:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      return sessionsToSave;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error saving chat sessions:", errorMessage);
      console.error("Full error details:", error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot delete from Supabase');
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting session:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      // If we deleted the current session, set a new current session
      if (currentSessionId === sessionId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error deleting session:', errorMessage);
      console.error('Full error details:', error);
      throw error;
    }
  }, [sessions, currentSessionId]);

  const clearAllSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot clear from Supabase');
        return;
      }

      // Delete all sessions for user
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all sessions:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      setSessions([]);
      setCurrentSessionId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error clearing all sessions:', errorMessage);
      console.error('Full error details:', error);
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

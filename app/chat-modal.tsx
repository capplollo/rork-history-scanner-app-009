import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, X, Sparkles, MapPin } from "lucide-react-native";
import { useChat } from "@/providers/ChatProvider";
import { useHistory } from "@/providers/HistoryProvider";
import { MonumentContext } from "@/services/aiChatService";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { voiceService } from "@/services/voiceService";

export default function ChatModalScreen() {
  const { 
    currentSession, 
    isLoading, 
    isSending, 
    sendMessage
  } = useChat();
  
  const { history } = useHistory();
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [inputText, setInputText] = useState("");
  const [selectedMonument, setSelectedMonument] = useState<MonumentContext | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleGoBack = () => {
    try {
      // Stop any playing voice when leaving chat
      voiceService.forceCleanup().catch(error => {
        console.error('Error during chat voice cleanup:', error);
      });
      
      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.replace('/(tabs)');
    }
  };
  
  // Cleanup voice when component unmounts
  useEffect(() => {
    return () => {
      voiceService.forceCleanup().catch(error => {
        console.error('Error during chat unmount voice cleanup:', error);
      });
    };
  }, []);
  
  // Additional cleanup when navigation focus changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Stop voice when navigating away from chat
      voiceService.forceCleanup().catch(error => {
        console.error('Error during chat navigation voice cleanup:', error);
      });
    });
    
    return unsubscribe;
  }, [navigation]);

  // Handle monument context from navigation params
  useEffect(() => {
    if (params.monumentId && params.monumentName) {
      const monument = history.find(m => m.id === params.monumentId);
      if (monument) {
        const monumentContext: MonumentContext = {
          id: monument.id,
          name: monument.name,
          location: monument.location,
          period: monument.period,
          description: monument.description,
          significance: monument.significance,
          facts: monument.facts,
          detailedDescription: monument.detailedDescription,
        };
        setSelectedMonument(monumentContext);
      }
    }
  }, [params.monumentId, params.monumentName, history]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const message = inputText.trim();
    setInputText("");

    try {
      // The sendMessage function will handle session creation if needed
      await sendMessage(message, currentSession?.id, selectedMonument || undefined);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const getSuggestedQuestions = () => {
    if (selectedMonument) {
      return [
        `Tell me more about ${selectedMonument.name}`,
        `What makes ${selectedMonument.name} historically significant?`,
        `What architectural features are unique to ${selectedMonument.name}?`,
        `What events happened at ${selectedMonument.name}?`,
      ];
    }
    return [
      "What are the most famous monuments in Rome?",
      "Tell me about ancient Egyptian architecture",
      "What makes monuments and art historically significant?",
      "How do archaeologists study ancient monuments?",
    ];
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.aiMessageTime]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={["#334155", "#1e293b"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>AI Chat</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {selectedMonument && (
              <View style={styles.selectedMonumentContainer}>
                <MapPin size={16} color="#4f46e5" />
                <Text style={styles.selectedMonumentText}>
                  Chatting about {selectedMonument.name}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {currentSession && currentSession.messages.length > 0 ? (
            currentSession.messages.map(renderMessage)
          ) : (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Sparkles size={60} color="#4f46e5" />
              </View>
              <Text style={styles.welcomeTitle}>Ask AI About These Monuments and Art</Text>
              <Text style={styles.welcomeText}>
                Get detailed information, historical context, and interesting facts about these monuments and art.
              </Text>
              
              {selectedMonument && (
                <View style={styles.contextInfo}>
                  <Text style={styles.contextTitle}>Current Context:</Text>
                  <Text style={styles.contextText}>{selectedMonument.name}</Text>
                  <Text style={styles.contextLocation}>{selectedMonument.location}</Text>
                </View>
              )}
              
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                {getSuggestedQuestions().map((question, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => setInputText(question)}
                  >
                    <Text style={styles.suggestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {isSending && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#64748b" />
                  <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about these monuments and art..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMonumentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedMonumentText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  welcomeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  contextInfo: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
  },
  contextText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  contextLocation: {
    fontSize: 14,
    color: "#64748b",
  },
  suggestionsContainer: {
    width: "100%",
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#374151",
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  aiMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#4f46e5",
  },
  aiBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#ffffff",
  },
  aiMessageText: {
    color: "#1e293b",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  aiMessageTime: {
    color: "#9ca3af",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#64748b",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
});

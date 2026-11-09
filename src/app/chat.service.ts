import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  createdAt?: string;
}

export interface ChatResponse {
  ai_response: string;
  rides_count: number;
  success: boolean;
  user_message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly historyKeyPrefix = 'vyro-ai-chat-history';

  constructor(private http: HttpClient) {}

  sendPrompt(prompt: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`http://127.0.0.1:5000/chat`, {
      message: prompt
    });
  }

  getHistory(userId: string) {
  return this.http.get<any>(
    `http://localhost:8080/chat/history/${userId}`
  );
}

  getChatUserId(): string {
    return (
      localStorage.getItem('driverId') ||
      localStorage.getItem('id') ||
      localStorage.getItem('username') ||
      'guest'
    );
  }

  loadLocalHistory(userId = this.getChatUserId()): ChatMessage[] {
    const rawHistory = localStorage.getItem(this.getHistoryKey(userId));

    if (!rawHistory) {
      return [];
    }

    try {
      const history = JSON.parse(rawHistory);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Unable to parse AI chat history:', error);
      return [];
    }
  }

  saveLocalHistory(messages: ChatMessage[], userId = this.getChatUserId()): void {
    localStorage.setItem(this.getHistoryKey(userId), JSON.stringify(messages));
  }

  addLocalMessage(message: ChatMessage, userId = this.getChatUserId()): ChatMessage[] {
    const history = this.loadLocalHistory(userId);
    const nextHistory = [
      ...history,
      {
        ...message,
        createdAt: message.createdAt || new Date().toISOString()
      }
    ];

    this.saveLocalHistory(nextHistory, userId);
    return nextHistory;
  }

  clearLocalHistory(userId = this.getChatUserId()): void {
    localStorage.removeItem(this.getHistoryKey(userId));
  }

  formatMessageText(text: string): string {
    const textWithoutRideIds = text.replace(/\*\*Ride ID:\s*[^*]+\*\*\s*-?\s*/gi, '');

    return this.escapeHtml(textWithoutRideIds)
      .replace(/Ride ID:\s*\S+\s*-?\s*/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\s+(\d+\.\s+)/g, '<br><br>$1')
      .replace(/\s+-\s+/g, '<br><span class="chat-detail-separator">-</span> ')
      .replace(/\n/g, '<br>');
  }

  private getHistoryKey(userId: string): string {
    return `${this.historyKeyPrefix}:${userId}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChatMessage, ChatService } from '../chat.service';

@Component({
  selector: 'app-support-chat',
  templateUrl: './support-chat.component.html',
  styleUrls: ['./support-chat.component.css']
})
export class SupportChatComponent implements OnInit {
  @ViewChild('chatWindow') chatWindow?: ElementRef<HTMLDivElement>;

  prompt = '';
  loading = false;

  defaultMessages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Hi! Ask me about ride safety, support, or how to use VyroPool.'
    }
  ];

  messages: ChatMessage[] = [...this.defaultMessages];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  getChatUserId(): string {
    return this.chatService.getChatUserId();
  }

  loadHistory(): void {
    const savedMessages = this.chatService.loadLocalHistory(this.getChatUserId());
    this.messages = savedMessages.length ? savedMessages : [...this.defaultMessages];
    this.scrollToLatestMessage();
  }

  send(): void {
    const trimmed = this.prompt.trim();

    if (!trimmed) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      text: trimmed
    };

    this.messages.push(userMessage);
    this.chatService.addLocalMessage(userMessage, this.getChatUserId());
    this.scrollToLatestMessage();

    this.loading = true;
    this.prompt = '';

    this.chatService
      .sendPrompt(trimmed)
      .subscribe({
        next: (result: any) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            text:
              result?.ai_response ||
              result?.response ||
              'Sorry, I did not receive an answer.'
          };

          this.messages.push(assistantMessage);
          this.chatService.addLocalMessage(assistantMessage, this.getChatUserId());
          this.scrollToLatestMessage();

          this.loading = false;
        },

        error: (error: any) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            text: error?.status === 500
              ? 'The AI ride assistant had a server error. Please check the Python chat service and try again.'
              : 'Unable to get a response from the server. Please try again later.'
          };

          this.messages.push(assistantMessage);
          this.chatService.addLocalMessage(assistantMessage, this.getChatUserId());
          this.scrollToLatestMessage();

          console.error('Chat error:', error);
          this.loading = false;
        }
      });
  }

  clearHistory(): void {
    this.chatService.clearLocalHistory(this.getChatUserId());
    this.messages = [...this.defaultMessages];
    this.scrollToLatestMessage();
  }

  formatMessageText(text: string): string {
    return this.chatService.formatMessageText(text);
  }

  private scrollToLatestMessage(): void {
    setTimeout(() => {
      const chatWindow = this.chatWindow?.nativeElement;

      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    });
  }
}

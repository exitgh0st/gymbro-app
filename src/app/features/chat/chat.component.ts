import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService, ChatMessage } from './chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="chat">
      <div class="chat-header">
        <h1>AI Trainer</h1>
        <p>Chat with your personal fitness coach</p>
      </div>

      <div class="chat-messages" #messagesContainer>
        @if (messages().length === 0 && !historyLoading()) {
          <div class="chat-welcome">
            <div class="welcome-icon">GB</div>
            <h2>Hey! I'm GymBro</h2>
            <p>Your AI personal trainer. Ask me anything about workouts, nutrition, or your fitness goals.</p>
            <div class="starter-prompts">
              @for (prompt of starterPrompts; track prompt) {
                <button class="starter-btn" (click)="sendStarterPrompt(prompt)">{{ prompt }}</button>
              }
            </div>
          </div>
        }

        @for (msg of messages(); track msg.id || $index) {
          <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            @if (msg.role === 'assistant') {
              <div class="message-avatar">GB</div>
            }
            <div class="message-content">
              <div class="message-bubble">{{ msg.content }}</div>
              @if (msg.saved_plan) {
                <a class="plan-saved-link" routerLink="/workout-plans">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Plan "{{ msg.saved_plan.title }}" saved! View Plans
                </a>
              }
            </div>
          </div>
        }

        @if (isTyping()) {
          <div class="message assistant">
            <div class="message-avatar">GB</div>
            <div class="message-bubble typing">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        }
      </div>

      <form class="chat-input" (ngSubmit)="onSend()">
        <input
          type="text"
          [(ngModel)]="inputText"
          name="message"
          placeholder="Ask your trainer..."
          [disabled]="isTyping()"
          autocomplete="off"
        />
        <button type="submit" class="btn btn-primary" [disabled]="!inputText.trim() || isTyping()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .chat {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 4rem);
      max-width: 800px;
    }

    .chat-header {
      margin-bottom: 1rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
      }

      p {
        color: var(--text-muted);
        font-size: 0.875rem;
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1rem;
    }

    .chat-welcome {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);

      .welcome-icon {
        width: 56px;
        height: 56px;
        background: var(--accent);
        color: #fff;
        border-radius: var(--radius);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.25rem;
        margin-bottom: 1rem;
      }

      h2 {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      p {
        max-width: 400px;
        margin: 0 auto;
      }
    }

    .starter-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .starter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: 2rem;
      background: var(--bg-primary);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      transition: all var(--transition);

      &:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-light);
      }
    }

    .message {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;

      &.user {
        justify-content: flex-end;

        .message-bubble {
          background: var(--accent);
          color: #fff;
          border-radius: var(--radius) var(--radius) 4px var(--radius);
        }
      }

      &.assistant {
        .message-bubble {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius) var(--radius) var(--radius) 4px;
        }
      }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      background: var(--accent-light);
      color: var(--accent);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      max-width: 70%;
      line-height: 1.5;
      font-size: 0.9375rem;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .typing {
      display: flex;
      gap: 4px;
      padding: 0.875rem 1.25rem;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: var(--text-muted);
      border-radius: 50%;
      animation: bounce 1.2s infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 70%;
    }

    .plan-saved-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--accent-light);
      color: var(--accent);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition);

      &:hover {
        background: var(--accent);
        color: #fff;
      }
    }

    .chat-input {
      display: flex;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);

      input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.9375rem;
        background: var(--bg-card);
        outline: none;
        transition: border-color var(--transition);

        &:focus {
          border-color: var(--accent);
        }
      }

      button {
        padding: 0.75rem;
        min-width: 44px;
      }
    }
  `]
})
export class ChatComponent {
  private readonly chatService = inject(ChatService);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);
  readonly historyLoading = signal(true);

  inputText = '';

  readonly starterPrompts = [
    'Create a workout plan for me',
    'What should I eat today?',
    'How can I improve my form?',
    'Help me track my macros',
  ];

  constructor() {
    afterNextRender(() => {
      this.loadHistory();
    });
  }

  sendStarterPrompt(prompt: string): void {
    this.inputText = prompt;
    this.onSend();
  }

  onSend(): void {
    const text = this.inputText.trim();
    if (!text) return;

    this.inputText = '';

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.scrollToBottom();
    this.isTyping.set(true);

    this.chatService.sendMessage(text).subscribe({
      next: res => {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.message,
          created_at: new Date().toISOString(),
          saved_plan: res.saved_plan,
        };
        this.messages.update(msgs => [...msgs, assistantMsg]);
        this.isTyping.set(false);
        this.scrollToBottom();
      },
      error: () => {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I had trouble responding. Please try again.',
          created_at: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, errorMsg]);
        this.isTyping.set(false);
        this.scrollToBottom();
      },
    });
  }

  private loadHistory(): void {
    this.chatService.getHistory().subscribe({
      next: msgs => {
        this.messages.set(msgs);
        this.historyLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.historyLoading.set(false);
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}

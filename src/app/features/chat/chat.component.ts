import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService, ChatMessage } from './chat.service';
import { WorkoutPlansService } from '../workout-plans/workout-plans.service';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MarkdownPipe],
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
              <div class="message-bubble" [innerHTML]="msg.content | markdown"></div>
              @if (msg.saved_plan) {
                <a class="plan-saved-link" routerLink="/workout-plans">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Plan "{{ msg.saved_plan.title }}" {{ msg.saved_plan.action === 'updated' ? 'updated' : 'created' }}! View Plans
                </a>
              }
              @if (msg.delete_plan_request) {
                <div class="plan-delete-confirm">
                  <span>Delete "{{ msg.delete_plan_request.title }}"?</span>
                  <div class="plan-delete-actions">
                    <button class="btn-confirm-delete" (click)="confirmDelete(msg)">Delete</button>
                    <button class="btn-cancel-delete" (click)="cancelDelete(msg)">Cancel</button>
                  </div>
                </div>
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

      <div class="chat-input">
        <textarea
          #chatInput
          [(ngModel)]="inputText"
          name="message"
          placeholder="Ask your trainer... (Shift+Enter for new line)"
          [disabled]="isTyping()"
          rows="1"
          (keydown)="onKeyDown($event)"
          (input)="autoResize()"
        ></textarea>
        <button type="button" class="btn btn-primary" [disabled]="!inputText.trim() || isTyping()" (click)="onSend()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
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
      word-wrap: break-word;

      ::ng-deep :is(h2, h3, h4) {
        margin: 0.5rem 0 0.25rem;
        font-size: 1rem;
        font-weight: 700;

        &:first-child {
          margin-top: 0;
        }
      }

      ::ng-deep strong {
        font-weight: 700;
      }

      ::ng-deep em {
        font-style: italic;
      }

      ::ng-deep code {
        background: rgba(0, 0, 0, 0.06);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-family: 'SF Mono', 'Consolas', monospace;
      }

      ::ng-deep ul, ::ng-deep ol {
        margin: 0.375rem 0;
        padding-left: 1.25rem;
      }

      ::ng-deep li {
        margin: 0.125rem 0;
      }
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

    .plan-delete-confirm {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #fff0f0;
      border: 1px solid #ffcccc;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;

      span {
        flex: 1;
        color: var(--text-primary);
        font-weight: 500;
      }
    }

    .plan-delete-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-confirm-delete {
      padding: 0.25rem 0.75rem;
      background: #e53e3e;
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition);

      &:hover {
        background: #c53030;
      }
    }

    .btn-cancel-delete {
      padding: 0.25rem 0.75rem;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        background: var(--bg-card);
      }
    }

    .chat-input {
      display: flex;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      align-items: flex-end;

      textarea {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.9375rem;
        font-family: inherit;
        background: var(--bg-card);
        outline: none;
        resize: none;
        height: auto;
        max-height: 160px;
        overflow-y: hidden;
        line-height: 1.5;
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

    @media (max-width: 768px) {
      .chat {
        height: calc(100vh - 2rem - 4.5rem);
      }

      .chat-header {
        h1 { font-size: 1.25rem; }
      }

      .message-bubble {
        max-width: 85%;
      }

      .message-content {
        max-width: 85%;
      }

      .chat-welcome {
        padding: 2rem 0.5rem;
      }

      .starter-prompts {
        flex-direction: column;
        align-items: stretch;
      }

      .plan-delete-confirm {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class ChatComponent {
  private readonly chatService = inject(ChatService);
  private readonly plansService = inject(WorkoutPlansService);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private readonly chatInputEl = viewChild<ElementRef<HTMLTextAreaElement>>('chatInput');

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

  autoResize(): void {
    const el = this.chatInputEl()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.overflowY = 'hidden';
    const maxHeight = 160;
    if (el.scrollHeight > maxHeight) {
      el.style.height = maxHeight + 'px';
      el.style.overflowY = 'auto';
    } else {
      el.style.height = el.scrollHeight + 'px';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return; // allow default newline insertion
      }
      event.preventDefault();
      event.stopPropagation();
      this.onSend();
    }
  }

  sendStarterPrompt(prompt: string): void {
    this.inputText = prompt;
    this.onSend();
  }

  onSend(): void {
    const text = this.inputText.trim();
    if (!text) return;

    this.inputText = '';
    const inputEl = this.chatInputEl()?.nativeElement;
    if (inputEl) inputEl.style.height = 'auto';

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
          delete_plan_request: res.delete_plan_request,
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

  confirmDelete(msg: ChatMessage): void {
    const req = msg.delete_plan_request;
    if (!req) return;

    this.plansService.delete(req.id).subscribe({
      next: () => {
        this.messages.update(msgs =>
          msgs.map(m => m === msg ? { ...m, delete_plan_request: undefined } : m)
        );
        const confirmMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Plan "${req.title}" has been deleted.`,
          created_at: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, confirmMsg]);
        this.scrollToBottom();
      },
      error: () => {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I couldn\'t delete the plan. Please try again.',
          created_at: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, errorMsg]);
        this.scrollToBottom();
      },
    });
  }

  cancelDelete(msg: ChatMessage): void {
    this.messages.update(msgs =>
      msgs.map(m => m === msg ? { ...m, delete_plan_request: undefined } : m)
    );
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

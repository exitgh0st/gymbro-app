import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  saved_plan?: { id: string; title: string };
}

export interface ChatResponse {
  message: string;
  saved_plan?: { id: string; title: string };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = inject(ApiService);

  sendMessage(message: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>('/chat/message', { message });
  }

  getHistory(): Observable<ChatMessage[]> {
    return this.api.get<ChatMessage[]>('/chat/history');
  }
}

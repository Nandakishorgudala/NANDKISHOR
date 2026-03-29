import { Component, ElementRef, ViewChild, AfterViewChecked, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Chat Toggle Button -->
    <button (click)="toggleChat()" class="chat-toggle-btn shadow-lg" [class.open]="isOpen">
      <div class="toggle-glow"></div>
      <span class="material-icons">{{ isOpen ? 'close' : 'smart_toy' }}</span>
      <span *ngIf="!isOpen" class="btn-label">AI Assistant</span>
    </button>

    <!-- Chat Window -->
    <div class="chat-window shadow-2xl" *ngIf="isOpen" [class.visible]="isOpen">
      <div class="chat-header">
        <div class="header-glass-bg"></div>
        <div class="header-info">
          <div class="bot-avatar-glowing">
            <span class="material-icons">smart_toy</span>
            <div class="avatar-ring"></div>
          </div>
          <div>
            <h3>ShieldSure AI</h3>
            <span class="status-indicator">Online | Insurance Expert</span>
          </div>
        </div>
        <button (click)="toggleChat()" class="close-btn">
          <span class="material-icons">keyboard_arrow_down</span>
        </button>
      </div>

      <div class="chat-messages" #scrollContainer>
        <div class="welcome-message" *ngIf="messages.length === 0">
          <div class="icon-circle">
            <span class="material-icons">verified_user</span>
          </div>
          <h4>Hello! I'm your Insurance Expert</h4>
          <p>I can assist you with <strong>Disaster Insurance Policies</strong>, coverage details, or filing a claim instantly.</p>
          <div class="suggestions">
            <button (click)="useSuggestion('What is disaster insurance?')">What is disaster insurance?</button>
            <button (click)="useSuggestion('How to file a claim?')">How to file a claim?</button>
            <button (click)="useSuggestion('What does the Earthquake policy cover?')">What does the Earthquake policy cover?</button>
          </div>
        </div>

        <div *ngFor="let msg of messages" [class]="msg.isUser ? 'message user' : 'message bot'">
          <div class="message-content shadow-sm" [innerHTML]="formatMessage(msg.text)">
          </div>
          <span class="timestamp" [class.user-time]="msg.isUser">{{ msg.timestamp | date:'shortTime' }}</span>
        </div>

        <div class="message bot typing" *ngIf="isTyping">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input border-t">
        <input 
          [(ngModel)]="userInput" 
          (keyup.enter)="sendMessage()" 
          placeholder="Type your insurance query..." 
          [disabled]="isTyping"
        />
        <button (click)="sendMessage()" [disabled]="!userInput.trim() || isTyping">
          <span class="material-icons">send</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-toggle-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 32px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1000;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
    }
    .chat-toggle-btn:hover { transform: scale(1.08) translateY(-4px); }
    .chat-toggle-btn.open { background: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    
    .toggle-glow {
      position: absolute;
      width: 100%; height: 100%;
      border-radius: 50%;
      background: inherit;
      filter: blur(12px);
      opacity: 0.6;
      z-index: -1;
      animation: pulse-glow 3s infinite alternate;
    }
    @keyframes pulse-glow {
      0% { opacity: 0.4; transform: scale(1); }
      100% { opacity: 0.8; transform: scale(1.2); }
    }

    .btn-label {
      position: absolute;
      right: 80px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      color: #0f172a;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      opacity: 0;
      transform: translateX(10px) scale(0.9);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .chat-toggle-btn:hover .btn-label { opacity: 1; transform: translateX(0) scale(1); }

    .chat-window {
      position: fixed;
      bottom: 110px;
      right: 24px;
      width: 400px;
      height: 600px;
      background: #ffffff;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1001;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
      transform-origin: bottom right;
      animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scaleIn {
      from { transform: scale(0.8) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    .chat-header {
      position: relative;
      background: linear-gradient(135deg, #312e81 0%, #4338ca 100%);
      color: white;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;
    }
    .header-glass-bg {
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      transform: rotate(30deg);
      pointer-events: none;
    }

    .header-info { display: flex; align-items: center; gap: 16px; z-index: 1; }
    .bot-avatar-glowing {
      position: relative;
      width: 48px; height: 48px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3);
    }
    .avatar-ring {
      position: absolute; width: 100%; height: 100%;
      border-radius: 14px;
      border: 2px solid rgba(255,255,255,0.5);
      animation: ripple 2s infinite;
    }
    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.3); opacity: 0; }
    }

    .chat-header h3 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .status-indicator { font-size: 13px; opacity: 0.9; display: flex; align-items: center; gap: 6px; margin-top: 4px;}
    .status-indicator::before { content: ''; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e;}

    .close-btn { background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display:flex; align-items:center; justify-content:center; transition: background 0.2s;}
    .close-btn:hover { background: rgba(255,255,255,0.3); }

    .chat-messages {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .welcome-message {
      text-align: center;
      padding: 32px 16px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
      margin-bottom: 8px;
    }
    .icon-circle {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
      color: #4f46e5;
      border-radius: 36px;
      margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 16px rgba(79,70,229,0.1);
    }
    .icon-circle .material-icons { font-size: 32px; }
    .welcome-message h4 { color: #0f172a; margin-bottom: 12px; font-size: 18px; font-weight: 700; }
    .welcome-message p { font-size: 14px; margin-bottom: 24px; line-height: 1.6; color:#475569;}
    
    .suggestions { display: flex; flex-direction: column; gap: 10px; }
    .suggestions button {
      background: transparent;
      border: 1.5px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #4f46e5;
      cursor: pointer;
       transition: all 0.2s;
    }
    .suggestions button:hover { background: #4f46e5; color: white; border-color: #4f46e5; transform: translateY(-2px); }

    .message { display: flex; flex-direction: column; max-width: 85%; animation: msgFade 0.3s ease-out; }
    @keyframes msgFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .message.user { align-self: flex-end; }
    .message.bot { align-self: flex-start; }

    .message-content {
      padding: 12px 18px;
      border-radius: 18px;
      font-size: 15px;
      line-height: 1.6;
      max-width: 85%;
      position: relative;
    }
    
    .message-content strong { font-weight: 700; color: inherit; }
    .message-content ul { margin: 8px 0; padding-left: 20px; }
    .message-content li { margin-bottom: 4px; }
    .message-content br { content: ""; display: block; margin-top: 8px; }

    .message.user .message-content {
      background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
      color: white;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
    }
    
    .message.bot .message-content {
      background: #f8fafc;
      color: #1e293b;
      border-bottom-left-radius: 4px;
      border: 1px solid #e2e8f0;
      align-self: flex-start;
    }

    .timestamp {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      display: block;
    }
    .timestamp.user-time { text-align: right; }

    .chat-input {
      padding: 20px;
      display: flex;
      gap: 12px;
      background: white;
      border-top: 1px solid #f1f5f9;
    }
    .chat-input input {
      flex: 1;
      border: 1.5px solid #e2e8f0;
      padding: 0 16px;
      border-radius: 14px;
      font-size: 15px;
      color: #1e293b;
      transition: border-color 0.2s;
    }
    .chat-input input:focus { border-color: #4f46e5; outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    
    .chat-input button {
      background: #4f46e5;
      color: white;
      border: none;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .chat-input button:disabled { background: #cbd5e1; cursor: not-allowed; }
    .chat-input button:not(:disabled):hover { background: #3730a3; transform: scale(1.05); }

    .typing-indicator { display: flex; gap: 6px; align-items: center; padding: 6px 4px; }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: Message[] = [];

  constructor(
    private api: ApiService, 
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  useSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isTyping) return;

    const userMsg = this.userInput.trim();
    this.messages.push({
      text: userMsg,
      isUser: true,
      timestamp: new Date()
    });

    this.userInput = '';
    this.isTyping = true;
    const botMsgIndex = this.messages.length;
    this.messages.push({
      text: '',
      isUser: false,
      timestamp: new Date()
    });

    // Build context array (limit to last 10 interactions for payload efficiency)
    const contextLimit = this.messages.slice(0, -1).slice(-10); // Exclude the empty bot message we just added
    const apiMessagesPayload = contextLimit.map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      let fullResponse = '';
      const stream = this.api.askChatbotStream(apiMessagesPayload);
      
      for await (const chunk of stream) {
        this.ngZone.run(() => {
          this.isTyping = false;
          fullResponse += chunk;
          
          this.messages[botMsgIndex] = {
            ...this.messages[botMsgIndex],
            text: fullResponse
          };
          
          this.messages = [...this.messages]; 
          this.cdr.detectChanges();
          this.scrollToBottom();
        });
      }
    } catch (err) {
      this.ngZone.run(() => {
        this.isTyping = false;
        this.messages[botMsgIndex].text = "I'm having trouble connecting to my brain right now. Please try again later!";
        this.messages = [...this.messages];
        this.cdr.detectChanges();
      });
    }
  }

  formatMessage(text: string): string {
    if (!text) return '';
    
    // 1. Escaping HTML to prevent XSS (basic)
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Lists: * item or - item at start of line
    formatted = formatted.replace(/^[\s]*[\*\-][\s]+(.*)$/gm, '<li>$1</li>');
    
    // Wrap groups of <li> in <ul>
    // This is a simple regex and might not handle nested lists perfectly, 
    // but works for standard flat lists from LLMs.
    formatted = formatted.replace(/(<li>.*<\/li>[\s\n]*)+/g, (match) => `<ul>${match}</ul>`);

    // 4. Line breaks: \n -> <br> (but not if already inside ul/li structure)
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}

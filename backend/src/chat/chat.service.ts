import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../shared/supabase.service';
import { WorkoutPlansService } from '../workout-plans/workout-plans.service';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly workoutPlansService: WorkoutPlansService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com',
    });
  }

  async sendMessage(userId: string, message: string) {
    const profile = await this.getProfile(userId);
    const history = await this.getRecentHistory(userId, 20);

    const systemPrompt = this.buildSystemPrompt(profile);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      max_tokens: 2048,
    });

    const assistantContent = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    // Detect and save workout plan from AI response
    let savedPlan: { id: string; title: string } | undefined;
    const planData = this.extractWorkoutPlan(assistantContent);
    if (planData) {
      try {
        const plan = await this.workoutPlansService.createPlan(userId, {
          title: planData.title,
          plan_data: planData.plan_data,
        });
        savedPlan = { id: plan.id, title: plan.title };
      } catch {}
    }

    // Strip the JSON block from the message shown to the user
    const cleanMessage = this.stripPlanBlock(assistantContent);

    await this.supabase.client.from('chat_messages').insert([
      { user_id: userId, role: 'user', content: message },
      { user_id: userId, role: 'assistant', content: cleanMessage },
    ]);

    return { message: cleanMessage, saved_plan: savedPlan };
  }

  async getHistory(userId: string) {
    const { data } = await this.supabase.client
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    return data ?? [];
  }

  private async getRecentHistory(userId: string, limit: number) {
    const { data } = await this.supabase.client
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data ?? []).reverse();
  }

  private async getProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return data;
  }

  private extractWorkoutPlan(content: string): { title: string; plan_data: Record<string, unknown> } | null {
    const match = content.match(/```workout-plan\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1].trim());
      return {
        title: parsed.title || 'AI-Generated Plan',
        plan_data: parsed.plan_data || parsed,
      };
    } catch {
      return null;
    }
  }

  private stripPlanBlock(content: string): string {
    return content.replace(/```workout-plan\s*[\s\S]*?```/g, '').trim();
  }

  private buildSystemPrompt(profile: any): string {
    const today = new Date().toISOString().split('T')[0];
    let prompt = `You are GymBro, a professional personal fitness trainer. You are friendly, motivating, and evidence-based.
Always give specific, actionable advice. Keep responses concise and motivating.
Today's date: ${today}.

IMPORTANT: When the user asks you to create, generate, or suggest a workout plan, you MUST include a structured JSON block in your response wrapped in \`\`\`workout-plan markers. The JSON must follow this exact format:
\`\`\`workout-plan
{
  "title": "Plan Title Here",
  "plan_data": {
    "days": [
      {
        "day": "Monday",
        "focus": "Muscle Group",
        "exercises": [
          { "name": "Exercise Name", "sets": 4, "reps": "8-10", "rest": "90s" }
        ]
      }
    ],
    "notes": "Any additional notes"
  }
}
\`\`\`
Include a friendly text explanation before the JSON block. The plan will be automatically saved for the user.`;

    if (profile) {
      prompt += `

Your client's profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Gender: ${profile.gender}
- Fitness goal: ${profile.fitness_goal?.replace(/_/g, ' ')}
- Activity level: ${profile.activity_level?.replace(/_/g, ' ')}

Tailor all advice to their specific profile and goals.`;
    }

    return prompt;
  }
}

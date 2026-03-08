import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../shared/supabase.service';
import { UpsertPlanDto } from './dto/upsert-plan.dto';
import OpenAI from 'openai';

@Injectable()
export class WorkoutPlansService {
  private readonly openai: OpenAI;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com',
    });
  }

  async generatePlan(userId: string, preferences?: string) {
    const profile = await this.getProfile(userId);
    const systemPrompt = this.buildSystemPrompt(profile, preferences);

    const completion = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a workout plan for me.' },
      ],
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const { title, plan_data } = this.parseAiResponse(raw);

    const { data, error } = await this.supabase.client
      .from('workout_plans')
      .insert({ user_id: userId, title, plan_data })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPlans(userId: string) {
    const { data } = await this.supabase.client
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return data ?? [];
  }

  async getPlan(userId: string, planId: string) {
    const { data, error } = await this.supabase.client
      .from('workout_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Plan not found');
    return data;
  }

  async createPlan(userId: string, dto: UpsertPlanDto) {
    const { data, error } = await this.supabase.client
      .from('workout_plans')
      .insert({ user_id: userId, title: dto.title, plan_data: dto.plan_data })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updatePlan(userId: string, planId: string, dto: UpsertPlanDto) {
    const { data, error } = await this.supabase.client
      .from('workout_plans')
      .update({ title: dto.title, plan_data: dto.plan_data, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Plan not found');
    return data;
  }

  async deletePlan(userId: string, planId: string) {
    const { error } = await this.supabase.client
      .from('workout_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { deleted: true };
  }

  private async getProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return data;
  }

  private buildSystemPrompt(profile: any, preferences?: string): string {
    let prompt = `You are a professional fitness trainer. Generate a structured weekly workout plan.
You MUST respond with ONLY valid JSON, no markdown, no explanation. Use this exact format:
{
  "title": "Plan title here",
  "plan_data": {
    "days": [
      {
        "day": "Monday",
        "focus": "Muscle group focus",
        "exercises": [
          { "name": "Exercise Name", "sets": 4, "reps": "8-10", "rest": "90s" }
        ]
      }
    ],
    "notes": "Any additional notes"
  }
}`;

    if (profile) {
      prompt += `

Client profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Gender: ${profile.gender}
- Fitness goal: ${profile.fitness_goal?.replace(/_/g, ' ')}
- Activity level: ${profile.activity_level?.replace(/_/g, ' ')}`;
    }

    if (preferences) {
      prompt += `\n\nAdditional preferences: ${preferences}`;
    }

    return prompt;
  }

  private parseAiResponse(raw: string): { title: string; plan_data: Record<string, unknown> } {
    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || 'AI-Generated Plan',
        plan_data: parsed.plan_data || parsed,
      };
    } catch {
      return {
        title: 'AI-Generated Plan',
        plan_data: { days: [], notes: raw },
      };
    }
  }
}

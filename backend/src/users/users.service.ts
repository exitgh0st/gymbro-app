import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Profile not found');
    return data;
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .upsert({ id: userId, ...dto }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

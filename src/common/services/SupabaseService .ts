import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<any, any, any, any, any>;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_API_KEY'),
    );
  }

  async deleteFile(...path: string[]) {
    return await this.getClient().storage.from('pics').remove(path);
  }
  getClient() {
    return this.supabase;
  }
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type EmailEventType = Database['public']['Enums']['email_event_type'];

export interface EmailEvent {
  id: string;
  email_id: string;
  event_type: EmailEventType;
  recipient: string;
  metadata: Record<string, unknown> | null;
  received_at: string;
}

interface UseEmailEventsOptions {
  eventType?: EmailEventType;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export function useEmailEvents(options: UseEmailEventsOptions = {}) {
  const { eventType, search, startDate, endDate, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ['email-events', eventType, search, startDate?.toISOString(), endDate?.toISOString(), page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('email_events')
        .select('*', { count: 'exact' })
        .order('received_at', { ascending: false });

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (search) {
        query = query.ilike('recipient', `%${search}%`);
      }

      if (startDate) {
        query = query.gte('received_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('received_at', endDate.toISOString());
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        events: (data || []) as EmailEvent[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export interface EmailStats {
  totalSent: number;
  deliveryRate: number;
  failureRate: number;
  statusDistribution: {
    status: string;
    count: number;
    color: string;
  }[];
  dailyEvolution: {
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }[];
}

const EMAIL_STATUS_COLORS = {
  sent: '#3b82f6',
  delivered: '#06b6d4',
  bounced: '#ef4444',
  failed: '#dc2626',
  clicked: '#8b5cf6',
  spam: '#f97316',
};

export function useEmailStats(days: number = 30) {
  const startDate = startOfDay(subDays(new Date(), days));

  return useQuery({
    queryKey: ['email-stats', days],
    queryFn: async (): Promise<EmailStats> => {
      // Fetch email events for the period
      const { data: events, error: eventsError } = await supabase
        .from('email_events')
        .select('event_type, received_at')
        .gte('received_at', startDate.toISOString());

      if (eventsError) throw eventsError;

      // Calculate stats
      const eventCounts: Record<string, number> = {};
      const dailyData: Record<string, Record<string, number>> = {};

      (events || []).forEach((event) => {
        // Count by type
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;

        // Group by date
        const dateKey = format(new Date(event.received_at), 'yyyy-MM-dd');
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { sent: 0, delivered: 0, bounced: 0, failed: 0 };
        }
        if (event.event_type in dailyData[dateKey]) {
          dailyData[dateKey][event.event_type]++;
        }
      });

      const totalSent = eventCounts['sent'] || 0;
      const delivered = eventCounts['delivered'] || 0;
      const bounced = eventCounts['bounced'] || 0;
      const failed = (eventCounts['bounced'] || 0) + (eventCounts['spam'] || 0);

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const failureRate = totalSent > 0 ? (failed / totalSent) * 100 : 0;

      // Build status distribution
      const statusDistribution = Object.entries(eventCounts).map(([status, count]) => ({
        status,
        count,
        color: EMAIL_STATUS_COLORS[status as keyof typeof EMAIL_STATUS_COLORS] || '#94a3b8',
      }));

      // Build daily evolution sorted by date
      const dailyEvolution = Object.entries(dailyData)
        .map(([date, counts]) => ({
          date,
          sent: counts.sent ?? 0,
          delivered: counts.delivered ?? 0,
          bounced: counts.bounced ?? 0,
          failed: counts.failed ?? 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalSent,
        deliveryRate,
        failureRate,
        statusDistribution,
        dailyEvolution,
      };
    },
  });
}

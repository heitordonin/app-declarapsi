import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmailStatsTab } from '@/components/emails/EmailStatsTab';
import { EmailEventsTab } from '@/components/emails/EmailEventsTab';
import { EmailQueueTab } from '@/components/emails/EmailQueueTab';
import { useEmailQueueFailedCount } from '@/hooks/contador/useEmailQueue';
import { BarChart3, ListChecks, Inbox } from 'lucide-react';

export default function Emails() {
  const { data: failedCount } = useEmailQueueFailedCount();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">E-mails</h1>
        <p className="text-muted-foreground">
          Monitore o envio de e-mails, eventos e gerencie a fila de envio.
        </p>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Fila</span>
            {failedCount && failedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                {failedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <EmailStatsTab />
        </TabsContent>

        <TabsContent value="events">
          <EmailEventsTab />
        </TabsContent>

        <TabsContent value="queue">
          <EmailQueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

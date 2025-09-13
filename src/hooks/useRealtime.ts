import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeOptions {
    table: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    schema?: string;
    filter?: string;
    onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtime({
    table,
    event = '*',
    schema = 'public',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        
        
        // Create unique channel name
        const channelName = `realtime-${table}-${Date.now()}`;

        // Create channel
        const channel = supabase.channel(channelName);
        channelRef.current = channel;
        console.log(channel)


        // Set up postgres changes listener
        const config: any = { event, schema, table };
        if (filter) config.filter = filter;

        channel.on('postgres_changes', config, (payload: RealtimePostgresChangesPayload<any>) => {
            console.log(`Real-time ${table} change:`, payload);

            // Call specific event handlers
            switch (payload.eventType) {
                case 'INSERT':
                    onInsert?.(payload);
                    break;
                case 'UPDATE':
                    onUpdate?.(payload);
                    break;
                case 'DELETE':
                    onDelete?.(payload);
                    break;
            }

            // Call general change handler
            onChange?.(payload);
        });

        // Monitor connection status
        channel.on('system', {}, (payload) => {
            console.log(`${table} real-time status:`, payload);
        });

        // Subscribe to channel
        channel.subscribe((status) => {
            console.log(`${table} subscription status:`, status);
        });

        // Cleanup function
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, event, schema, filter, onInsert, onUpdate, onDelete, onChange]);

    return channelRef.current;
}

// Hook for monitoring check-in status changes specifically
export function useCheckInRealtime(onCheckInChange: (childId: string, checkedIn: boolean, checkedInAt: string | null) => void) {
    return useRealtime({
        table: 'children',
        event: 'UPDATE',
        onUpdate: (payload) => {
            if (payload.new && payload.old) {
                const newData = payload.new;
                const oldData = payload.old;

                // Only trigger if check-in status actually changed
                if (newData.checked_in !== oldData.checked_in) {
                    onCheckInChange(newData.id, newData.checked_in, newData.checked_in_at);
                }
            }
        },
    });
}
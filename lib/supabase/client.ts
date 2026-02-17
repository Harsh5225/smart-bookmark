import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
                timeout: 30000, // 30 seconds (increased from default 10s)
            },
            global: {
                headers: {
                    'x-client-info': 'supabase-js-web',
                },
            },
        }
    )
}

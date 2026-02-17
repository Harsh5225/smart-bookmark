'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkCard from '@/components/BookmarkCard'
import Navbar from '@/components/Navbar'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
    user_id: string
}
const supabase = createClient()
export default function DashboardPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [loading, setLoading] = useState(true)
    const [userEmail, setUserEmail] = useState('')
    const [realtimeConnected, setRealtimeConnected] = useState(false)
    const router = useRouter()


    useEffect(() => {
        // Check authentication
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserEmail(user.email || '')
        }
        checkUser()

        // Initial fetch
        const fetchBookmarks = async () => {
            const { data, error } = await supabase
                .from('bookmarks')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching bookmarks:', error)
            } else {
                setBookmarks(data || [])
            }
            setLoading(false)
        }
        fetchBookmarks()

        // Realtime subscription
        const channel = supabase
            .channel('bookmarks-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookmarks',
                },
                (payload) => {
                    console.log('🔥 Realtime event:', payload.eventType, payload)
                    if (payload.eventType === 'INSERT') {
                        console.log('📥 INSERT event received for bookmark:', payload.new.id)
                        setBookmarks((prev) => {
                            // Check if bookmark already exists (avoid duplicates from optimistic updates)
                            const exists = prev.some(b => b.id === payload.new.id)
                            console.log('Current bookmark IDs:', prev.map(b => b.id))
                            console.log('New bookmark ID:', payload.new.id)
                            console.log('Exists?', exists)
                            if (exists) {
                                console.log('⚠️ Bookmark already exists (from optimistic update), skipping Realtime INSERT')
                                return prev
                            }
                            console.log('✅ Adding bookmark from Realtime INSERT')
                            return [payload.new as Bookmark, ...prev]
                        })
                    } else if (payload.eventType === 'DELETE') {
                        console.log('🗑️ Deleting bookmark:', payload.old.id)
                        setBookmarks((prev) =>
                            prev.filter((b) => b.id !== payload.old.id)
                        )
                    } else if (payload.eventType === 'UPDATE') {
                        setBookmarks((prev) =>
                            prev.map((b) => (b.id === payload.new.id ? payload.new as Bookmark : b))
                        )
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('📡 Realtime subscription status:', status)
                if (err) {
                    console.error('❌ Realtime subscription error:', err)
                }
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to bookmarks Realtime')
                    setRealtimeConnected(true)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Channel error - check Realtime settings')
                    setRealtimeConnected(false)
                } else if (status === 'TIMED_OUT') {
                    console.error('❌ Subscription timed out')
                    setRealtimeConnected(false)
                } else if (status === 'CLOSED') {
                    console.warn('⚠️ Channel closed')
                    setRealtimeConnected(false)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    const handleBookmarkAdded = (newBookmark: Bookmark) => {
        console.log('➕ Optimistically adding bookmark:', newBookmark.id)
        setBookmarks((prev) => {
            // Check if it already exists (avoid duplicates from Realtime)
            if (prev.some(b => b.id === newBookmark.id)) {
                console.log('⚠️ Bookmark already exists, skipping')
                return prev
            }
            return [newBookmark, ...prev]
        })
    }

    const handleBookmarkDeleted = (id: string) => {
        console.log('🗑️ Optimistically deleting bookmark:', id)
        setBookmarks((prev) => prev.filter(b => b.id !== id))
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {userEmail && <Navbar userEmail={userEmail} />}

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Add Bookmark Section */}
                <div className="mb-8">
                    <AddBookmarkForm onBookmarkAdded={handleBookmarkAdded} />
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        Your Bookmarks {!loading && `(${bookmarks.length})`}
                    </h2>

                    {/* Realtime Connection Status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-sm ${realtimeConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {realtimeConnected ? 'Live' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="text-gray-400 mt-4">Loading bookmarks...</p>
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-lg">No bookmarks yet!</p>
                        <p className="text-gray-500 text-sm mt-2">Add your first bookmark above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookmarks.map((bookmark) => (
                            <BookmarkCard
                                key={bookmark.id}
                                bookmark={bookmark}
                                onDelete={handleBookmarkDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

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
    const [user, setUser] = useState<any>(null)
    const [userEmail, setUserEmail] = useState('')
    const [realtimeConnected, setRealtimeConnected] = useState(false)

    const router = useRouter()

    // -----------------------------
    // 1️⃣ AUTH CHECK
    // -----------------------------
    useEffect(() => {
        const initUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            console.log("PRODUCTION USER:", user)

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)
            setUserEmail(user.email || '')
        }

        initUser()
    }, [router])

    // -----------------------------
    // 2️⃣ FETCH BOOKMARKS
    // -----------------------------
    useEffect(() => {
        if (!user) return

        const fetchBookmarks = async () => {
            const { data, error } = await supabase
                .from('bookmarks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching bookmarks:', error)
            } else {
                setBookmarks(data || [])
            }

            setLoading(false)
        }

        fetchBookmarks()
    }, [user])

    // -----------------------------
    // 3️⃣ REALTIME SUBSCRIPTION
    // -----------------------------
    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel('bookmarks-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${user.id}`, // 🔥 critical
                },
                (payload) => {
                    console.log('🔥 Realtime event:', payload.eventType)

                    if (payload.eventType === 'INSERT') {
                        setBookmarks(prev => {
                            if (prev.some(b => b.id === payload.new.id)) return prev
                            return [payload.new as Bookmark, ...prev]
                        })
                    }

                    if (payload.eventType === 'DELETE') {
                        setBookmarks(prev =>
                            prev.filter(b => b.id !== payload.old.id)
                        )
                    }

                    if (payload.eventType === 'UPDATE') {
                        setBookmarks(prev =>
                            prev.map(b =>
                                b.id === payload.new.id
                                    ? payload.new as Bookmark
                                    : b
                            )
                        )
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime status:', status)
                setRealtimeConnected(status === 'SUBSCRIBED')
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    // -----------------------------
    // OPTIMISTIC ADD
    // -----------------------------
    const handleBookmarkAdded = (newBookmark: Bookmark) => {
        setBookmarks(prev => {
            if (prev.some(b => b.id === newBookmark.id)) return prev
            return [newBookmark, ...prev]
        })
    }

    // -----------------------------
    // OPTIMISTIC DELETE
    // -----------------------------
    const handleBookmarkDeleted = (id: string) => {
        setBookmarks(prev =>
            prev.filter(b => b.id !== id)
        )
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {userEmail && <Navbar userEmail={userEmail} />}

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <AddBookmarkForm onBookmarkAdded={handleBookmarkAdded} />
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        Your Bookmarks {!loading && `(${bookmarks.length})`}
                    </h2>

                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${realtimeConnected
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-red-500'
                                }`}
                        ></div>
                        <span
                            className={`text-sm ${realtimeConnected
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                        >
                            {realtimeConnected ? 'Live' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent"></div>
                        <p className="text-gray-400 mt-4">
                            Loading bookmarks...
                        </p>
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-lg">
                            No bookmarks yet!
                        </p>
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

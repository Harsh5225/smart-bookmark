'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
const supabase = createClient()

export default function Navbar({ userEmail }: { userEmail: string }) {
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔖</span>
                    <h1 className="text-xl font-bold text-white">Smart Bookmarks</h1>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{userEmail}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}

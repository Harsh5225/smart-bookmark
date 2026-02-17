'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
    user_id: string
}

export default function AddBookmarkForm({ onBookmarkAdded }: { onBookmarkAdded?: (bookmark: Bookmark) => void }) {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [favicon, setFavicon] = useState('')
    const supabase = createClient()

    // Extract domain for favicon
    useEffect(() => {
        if (url) {
            try {
                let cleanUrl = url
                // Add protocol if missing
                if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                    cleanUrl = 'https://' + cleanUrl
                }
                const urlObj = new URL(cleanUrl)
                const domain = urlObj.hostname

                // Use DuckDuckGo favicon API (more reliable than Google)
                setFavicon(`https://icons.duckduckgo.com/ip3/${domain}.ico`)
            } catch {
                setFavicon('')
            }
        } else {
            setFavicon('')
        }
    }, [url])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!url || !title) {
            return
        }

        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data, error } = await supabase.from('bookmarks').insert({
            url,
            title,
            user_id: user.id,
        }).select()

        if (!error) {
            // Optimistically update UI
            if (onBookmarkAdded && data && data[0]) {
                onBookmarkAdded(data[0])
            }

            // Show success toast
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)

            setUrl('')
            setTitle('')
        }

        setLoading(false)
    }

    return (
        <>
            {/* Success Toast */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-500/50 flex items-center gap-3 backdrop-blur-xl border border-green-400/30">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Bookmark added successfully!</span>
                </div>
            </div>

            <div className="relative">
                <div className="relative bg-gray-900/90 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl transition-all duration-300 hover:border-gray-600 hover:scale-[1.01]" suppressHydrationWarning>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Add New Bookmark
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Save and organize your favorite websites</p>
                        </div>
                    </div>

                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title Input with Floating Label */}
                            <div className="relative group/input">
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder=" "
                                    className="peer w-full px-4 pt-6 pb-2 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-blue-500 transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600"
                                    disabled={loading}
                                    suppressHydrationWarning
                                />
                                <label
                                    htmlFor="title"
                                    className="absolute left-4 top-2 text-xs font-semibold text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 flex items-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                    </svg>
                                    Bookmark Title
                                </label>
                            </div>

                            {/* URL Input with Floating Label */}
                            <div className="relative group/input">
                                <input
                                    id="url"
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder=" "
                                    className="peer w-full px-4 pt-6 pb-2 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-purple-500 transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600"
                                    disabled={loading}
                                    suppressHydrationWarning
                                />
                                <label
                                    htmlFor="url"
                                    className="absolute left-4 top-2 text-xs font-semibold text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 flex items-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                    </svg>
                                    Website URL
                                </label>
                            </div>

                            {/* Submit Button with Glow */}
                            <button
                                type="submit"
                                disabled={loading || !url || !title}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >

                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Bookmark
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Right: Live Preview */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className={`w-full transition-all duration-500 ${url || title ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                                {/* Preview Card */}
                                <div className="relative">

                                    <div className="relative bg-gray-800 p-6 rounded-xl border border-gray-700">
                                        <div className="flex items-start gap-4">
                                            {/* Favicon */}
                                            <div className="shrink-0 w-14 h-14 bg-gray-700/50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-600">
                                                {favicon ? (
                                                    <img src={favicon} alt="favicon" className="w-8 h-8" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white truncate mb-1">
                                                    {title || 'Your Bookmark Title'}
                                                </h3>
                                                <p className="text-sm text-gray-400 truncate">
                                                    {url || 'https://example.com'}
                                                </p>
                                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    Live Preview
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Label */}
                                <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
                                    <span className="inline-block h-2 w-2 bg-blue-500 rounded-full"></span>
                                    Preview updates as you type
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

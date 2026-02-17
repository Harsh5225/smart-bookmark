'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
}

export default function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
    const [deleting, setDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [favicon, setFavicon] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const supabase = createClient()

    // Extract domain for favicon
    useEffect(() => {
        try {
            let url = bookmark.url
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url
            }
            const urlObj = new URL(url)
            const domain = urlObj.hostname

            // Use DuckDuckGo favicon API (more reliable than Google)
            setFavicon(`https://icons.duckduckgo.com/ip3/${domain}.ico`)
        } catch {
            setFavicon('')
        }
    }, [bookmark.url])

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleDelete = async () => {
        setDeleting(true)
        setShowDeleteModal(false)

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', bookmark.id)

        if (error) {
            console.error('Error deleting bookmark:', error)
            showToast('Failed to delete bookmark', 'error')
            setDeleting(false)
        } else {
            showToast('Bookmark deleted successfully', 'success')
        }
        // No need to update state - Realtime will handle it
    }

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(bookmark.url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const getDomain = (url: string) => {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch {
            return url
        }
    }

    return (
        <>
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Delete Bookmark?</h3>
                                <p className="text-sm text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-white">"{bookmark.title}"</span>?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookmark Card */}
            <div className="group relative h-full">
                <div className="relative h-full bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:border-gray-700 hover:scale-[1.02]">

                    <div className="relative flex flex-col h-full">
                        {/* Header with favicon and delete button */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Real Favicon */}
                                <div className="shrink-0 w-12 h-12 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden group-hover:border-blue-500/50 transition-colors">
                                    {favicon ? (
                                        <img src={favicon} alt="favicon" className="w-7 h-7" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {bookmark.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                disabled={deleting}
                                className="shrink-0 text-gray-500 hover:text-red-400 disabled:text-red-600 disabled:cursor-not-allowed transition-all duration-200 p-2 rounded-lg hover:bg-red-500/10 group-hover:scale-110"
                                title="Delete bookmark"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Domain badge */}
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-400 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                                {getDomain(bookmark.url)}
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mb-4">
                            {/* Visit button */}
                            <a
                                href={bookmark.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span className="flex items-center justify-center gap-2 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                    Visit
                                </span>
                            </a>

                            {/* Copy URL button */}
                            <button
                                onClick={handleCopyUrl}
                                className="px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-xl transition-all duration-200 group/copy"
                                title="Copy URL"
                            >
                                {copied ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Footer with date */}
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-800/50 group-hover:border-gray-700/50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-gray-500">Added {formatDate(bookmark.created_at)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 animate-slide-down">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${toast.type === 'success'
                        ? 'bg-green-500/90 border-green-400 text-white'
                        : 'bg-red-500/90 border-red-400 text-white'
                        }`}>
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="font-semibold">{toast.message}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

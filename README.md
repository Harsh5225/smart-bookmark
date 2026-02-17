# 🔖 Smart Bookmarks

A modern, real-time bookmark manager built with Next.js 14, Supabase, and Tailwind CSS. Save, organize, and sync your bookmarks across all your devices instantly.

## ✨ Features

- **🔐 Google OAuth Authentication** — Secure one-click sign-in with Google
- **⚡ Real-time Synchronization** — Bookmarks update instantly across all open tabs and devices
- **🔒 Private & Secure** — Row Level Security (RLS) ensures complete data isolation
- **🎨 Modern UI** — Clean, responsive design with Tailwind CSS
- **🚀 Fast & SEO-friendly** — Server-side rendering with Next.js App Router
- **📱 Responsive** — Works seamlessly on desktop, tablet, and mobile

## 🧠 Technical Challenges & AI-Assisted Resolution

During the development of the real-time synchronization feature, we encountered a complex distributed systems challenge where **INSERT events were not syncing across tabs in production**, while DELETE events worked perfectly.

### 🚫 The Problem
- **Local Environment**: Works fine.
- **Production (Vercel)**: 
  - DELETE events sync instantly ⚡
  - INSERT events do NOT appear in other tabs ❌
  - No visible errors in console.

### 🕵️ Investigation & Debugging
We used a systematic, AI-assisted approach to isolate the root cause:

1. **Database & RLS Verification**: 
   - Verified `bookmarks` table had Row Level Security (RLS) enabled.
   - Confirmed `INSERT` policy allowed users to insert their own rows.
   - *Key Discovery*: Realtime events respect RLS. If a user can't "see" the new row via SELECT policy immediately, the event won't be sent.

2. **Realtime Publication Check**:
   - Used SQL queries to inspect `pg_publication_tables`.
   - Confirmed `supabase_realtime` publication included `insert`, `update`, `delete`.
   - Tuned `REPLICA IDENTITY` to `FULL` to ensure complete row data broadcast.

3. **Network & Timing Analysis (The Breakthrough)**:
   - Analyzed browser logs: `⚠️ Channel closed` and `TIMED_OUT`.
   - **Root Cause Identified**: The Realtime subscription was initializing *before* the authentication session was fully restored in the browser. 
   - When the socket connected, `auth.uid()` was null. 
   - RLS Policy `USING (auth.uid() = user_id)` failed silently for the anonymous socket.

### ✅ The Solution: Split-Effect Architecture
We refactored the `DashboardPage.tsx` to strictly separate concerns and enforce sequence:

1. **Auth First**: A dedicated `useEffect` waits for `supabase.auth.getUser()`.
2. **Conditional Subscription**: Realtime connection *only* attempts to connect after `user` is confirmed.
3. **Explicit Filtering**: Added `filter: user_id=eq.${user.id}` to the subscription channel, matching the RLS policy.
4. **Optimistic Updates**: Implemented local state updates immediately for best UX, with duplicate blocking to prevent "double adds" when the Realtime event eventually arrives.

```typescript
// Simplified Solution Logic
useEffect(() => {
  if (!user) return; // 🛑 STOP if no user

  const channel = supabase
    .channel('realtime')
    .on('postgres_changes', { filter: `user_id=eq.${user.id}` }, (payload) => {
       // Handle sync
    })
    .subscribe();
}, [user]); // 👈 Re-run ONLY when user is authenticated
```

### 🤖 How AI Helped
I utilized AI not just for code generation, but as a **reasoning engine** to:
- **Analyze Race Conditions**: AI suggested the "Auth vs Subscription" race condition which is common in React + Supabase.
- **Verify SQL Policies**: Generated complex SQL queries to inspect hidden Postgres system tables (`pg_publication`, `pg_policies`).
- **Architectural Refactoring**: Guided the transition from a monolithic `useEffect` to a separated, state-driven architecture that is robust for production.

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** (App Router) | React framework with SSR and file-based routing |
| **Supabase** | Backend-as-a-Service (Auth, PostgreSQL, Realtime) |
| **Tailwind CSS** | Utility-first CSS framework |
| **TypeScript** | Type-safe development |
| **Vercel** | Deployment and hosting |

## 🏗 Architecture

### Server vs Client Components

- **Server Components**: Landing page, layouts (faster initial load, better SEO)
- **Client Components**: Dashboard, forms, interactive UI (real-time updates, user interactions)
- **Route Handlers**: OAuth callback, API endpoints

### Authentication Flow

```
User clicks "Login with Google"
  ↓
Google OAuth consent screen
  ↓
Supabase Auth backend (exchanges code for tokens)
  ↓
App callback route (sets session cookies)
  ↓
Proxy middleware (validates & refreshes sessions)
  ↓
Protected dashboard (user authenticated)
```

### Real-time Architecture

```
User adds bookmark in Tab A
  ↓
INSERT to PostgreSQL → Write-Ahead Log (WAL)
  ↓
Supabase Realtime server (reads WAL via wal2json)
  ↓
WebSocket broadcast (respects RLS policies)
  ↓
All subscribed tabs receive event
  ↓
React state updates → UI re-renders
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Google Cloud Platform account (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-bookmarks.git
   cd smart-bookmarks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase**

   Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Create bookmarks table
   CREATE TABLE public.bookmarks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     url TEXT NOT NULL,
     title TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
   );

   -- Create index for faster queries
   CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);

   -- Enable Row Level Security
   ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   CREATE POLICY "Users can view own bookmarks"
     ON public.bookmarks FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own bookmarks"
     ON public.bookmarks FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own bookmarks"
     ON public.bookmarks FOR DELETE
     USING (auth.uid() = user_id);

   -- Enable Realtime
   ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks 
   WITH (publish = 'insert, update, delete');
   ```

5. **Configure Google OAuth**

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Add authorized JavaScript origin: `https://YOUR_SUPABASE_PROJECT.supabase.co`
   - Copy Client ID and Secret to Supabase Dashboard → Authentication → Providers → Google

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
smart-bookmarks/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page (Server Component)
│   ├── globals.css             # Global styles
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth callback handler
│   ├── login/
│   │   └── page.tsx            # Login page (Client Component)
│   └── dashboard/
│       └── page.tsx            # Dashboard (Client Component)
├── components/
│   ├── AddBookmarkForm.tsx     # Form to add bookmarks
│   ├── BookmarkCard.tsx        # Individual bookmark display
│   └── Navbar.tsx              # Navigation bar
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client
├── proxy.ts                    # Session management middleware
└── .env.local                  # Environment variables (not in git)
```

## 🔒 Security

### Row Level Security (RLS)

All database queries are automatically filtered by PostgreSQL RLS policies:
- Users can only see their own bookmarks
- Users can only insert bookmarks with their own user_id
- Users can only delete their own bookmarks

### Authentication

- **Session Management**: HTTP-only cookies prevent XSS attacks
- **Token Refresh**: Proxy middleware automatically refreshes expired tokens
- **Server Validation**: `getUser()` validates JWTs on the server (not just client-side)

### Best Practices

- ✅ Environment variables for sensitive data
- ✅ RLS enforced at database level (defense in depth)
- ✅ HTTPS only in production
- ✅ OAuth 2.0 for authentication
- ✅ No service role key exposed to client

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/smart-bookmarks.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Update OAuth Redirect URLs**
   - Add `https://your-app.vercel.app/auth/callback` to:
     - Supabase Dashboard → Auth → URL Configuration
     - Google Cloud Console → OAuth credentials

5. **Deploy!**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-app.vercel.app`

## 🧪 Testing

### Test Authentication
1. Go to `/login`
2. Click "Continue with Google"
3. Approve Google consent
4. Should redirect to `/dashboard`

### Test Real-time Sync
1. Open `/dashboard` in two browser tabs
2. Add a bookmark in Tab A
3. Bookmark should appear in Tab B instantly
4. Delete a bookmark in Tab B
5. Should disappear from Tab A instantly


## 📚 Key Concepts

### App Router vs Pages Router

| Feature | Pages Router | App Router |
|---------|-------------|-----------|
| Rendering | Client-side | Server-first |
| Routing | `pages/` folder | `app/` folder |
| Data Fetching | `getServerSideProps` | `async` Server Components |
| Layouts | Manual | Nested layouts |

### Server vs Client Components

- **Server Components** (default): Run on server, no JavaScript sent to client
- **Client Components** (`'use client'`): Interactive, use hooks, event handlers

### Supabase Realtime

- Uses PostgreSQL's logical replication (WAL)
- WebSocket connection for instant updates
- Respects RLS policies
- Sub-100ms latency

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS Framework
- [Vercel](https://vercel.com/) - Deployment Platform

---

**Built with ❤️ using Next.js 16 and Supabase**

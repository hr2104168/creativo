'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = {
    poetry: { label: '✍️ Poetry', bg: '#E8D5F5', color: '#6B3FA0' },
    story: { label: '📖 Story', bg: '#D5E5F5', color: '#2D70A0' },
    artidea: { label: '🎨 Art Idea', bg: '#F5E5D0', color: '#A05820' },
    prompt: { label: '💡 Prompt', bg: '#D5F0E0', color: '#28805A' },
    motivation: { label: '✨ Motivation', bg: '#F5D8E8', color: '#A03070' },
}

const AVATAR_COLORS = ['#B39DDB', '#F48FB1', '#80DEEA', '#FFE082', '#A5D6A7', '#EF9A9A', '#90CAF9', '#CE93D8']

function getAvatarColor(id) {
    let h = 0
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(name) {
    return name.slice(0, 2).toUpperCase()
}

function formatDate(ts) {
    const diff = Date.now() - new Date(ts)
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Avatar({ user, size = 40 }) {
    const fontSize = size <= 32 ? '11px' : size <= 40 ? '13px' : '20px'
    if (user?.profilePicture) {
        return (
            <img
                src={user.profilePicture}
                alt={user.username}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
        )
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: getAvatarColor(user?.id || 'x'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '600', fontSize, flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
        }}>
            {getInitials(user?.username || '??')}
        </div>
    )
}

function Toast({ message, type }) {
    return (
        <div style={{
            position: 'fixed', bottom: '28px', left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'error' ? '#E07070' : '#7F77DD',
            color: '#fff', padding: '12px 24px',
            borderRadius: '9999px', fontSize: '14px', fontWeight: '500',
            boxShadow: '0 8px 32px rgba(100,60,180,0.16)',
            zIndex: 1000, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '8px',
        }}>
            {type === 'error' ? '⚠️' : '✨'} {message}
        </div>
    )
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 500, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '16px',
        }} onClick={onCancel}>
            <div style={{
                background: '#fff', borderRadius: '20px',
                padding: '28px', maxWidth: '360px', width: '100%',
                boxShadow: '0 16px 48px rgba(100,60,180,0.20)',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: '500', color: '#2C2C2A', marginBottom: '12px' }}>
                    {title}
                </h3>
                {message && <p style={{ fontSize: '14px', color: '#6B5BA0', marginBottom: '20px', lineHeight: '1.6' }}>{message}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onCancel} style={{
                        padding: '9px 20px', borderRadius: '9999px',
                        border: '1.5px solid #C8B8E8', background: 'transparent',
                        color: '#6B5BA0', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '9px 20px', borderRadius: '9999px',
                        border: 'none', background: '#E07070',
                        color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>Confirm</button>
                </div>
            </div>
        </div>
    )
}

export default function FeedPage() {
    const router = useRouter()

    const [currentUser, setCurrentUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [users, setUsers] = useState([])
    const [activeTab, setActiveTab] = useState('feed')
    const [activeFilter, setActiveFilter] = useState('all')
    const [postContent, setPostContent] = useState('')
    const [selectedCat, setSelectedCat] = useState('poetry')
    const [artFile, setArtFile] = useState(null)
    const [artPreview, setArtPreview] = useState('')
    const [posting, setPosting] = useState(false)
    const [openComments, setOpenComments] = useState({})
    const [commentInputs, setCommentInputs] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [toast, setToast] = useState(null)
    const [confirm, setConfirm] = useState(null)
    const [loading, setLoading] = useState(true)

    function showToast(message, type = 'success') {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    function askConfirm(title, message, onConfirm) {
        setConfirm({ title, message, onConfirm })
    }

    // Load current user
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(data => {
                if (!data.user) { router.push('/'); return }
                setCurrentUser(data.user)
            })
            .catch(() => router.push('/'))
    }, [])

    // Load posts whenever tab or filter changes
    useEffect(() => {
        if (!currentUser) return
        loadPosts()
    }, [currentUser, activeTab, activeFilter])

    // Load sidebar users
    useEffect(() => {
        if (!currentUser) return
        fetch('/api/users')
            .then(r => r.json())
            .then(data => { if (data.users) setUsers(data.users) })
    }, [currentUser])

    useEffect(() => {
        if (!currentUser) return

        const q = searchQuery.trim()
        if (!q) {
            setSearchResults([])
            setSearching(false)
            return
        }

        setSearching(true)
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
                const data = await res.json()
                setSearchResults(data.users || [])
            } finally {
                setSearching(false)
            }
        }, 250)

        return () => clearTimeout(timeout)
    }, [searchQuery, currentUser])

    async function loadPosts() {
        setLoading(true)
        try {
            const res = await fetch(`/api/posts?tab=${activeTab}&category=${activeFilter}`)
            const data = await res.json()
            if (data.posts) setPosts(data.posts)
        } finally {
            setLoading(false)
        }
    }

    function updatePost(postId, changePost) {
        setPosts(prev => prev.map(post =>
            post.id === postId ? changePost(post) : post
        ))
    }

    function handleArtFileChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.type)) {
            showToast('Only JPEG, PNG, WebP, GIF allowed.', 'error')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2 MB.', 'error')
            return
        }

        setArtFile(file)
        setArtPreview(URL.createObjectURL(file))
        setSelectedCat('artidea')
    }

    function clearArtFile() {
        setArtFile(null)
        setArtPreview('')
    }

    async function handleSubmitPost() {
        if (!postContent.trim()) { showToast('Write a caption first!', 'error'); return }
        if (postContent.length > 200) { showToast('Keep it under 200 characters!', 'error'); return }

        setPosting(true)
        let imageUrl = null

        if (artFile) {
            const form = new FormData()
            form.append('file', artFile)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok) {
                showToast(uploadData.error || 'Image upload failed.', 'error')
                setPosting(false)
                return
            }
            imageUrl = uploadData.url
        }

        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: postContent, category: selectedCat, imageUrl }),
        })
        if (res.ok) {
            setPostContent('')
            clearArtFile()
            showToast('Your creation is live! ✨')
            loadPosts()
        }
        setPosting(false)
    }

    async function handleDeletePost(postId) {
        askConfirm('Delete this post?', 'This cannot be undone.', async () => {
            setConfirm(null)
            const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
            if (res.ok) {
                setPosts(prev => prev.filter(post => post.id !== postId))
                showToast('Post deleted')
            }
        })
    }

    async function handleReact(postId, type) {
        const res = await fetch(`/api/posts/${postId}/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
        })
        if (!res.ok) return

        updatePost(postId, post => {
            const reactions = post.reactions || []
            const existing = reactions.find(r => r.userId === currentUser.id)

            if (!existing) {
                return {
                    ...post,
                    reactions: [...reactions, { id: `new-${postId}-${currentUser.id}`, userId: currentUser.id, type }],
                }
            }

            if (existing.type === type) {
                return {
                    ...post,
                    reactions: reactions.filter(r => r.userId !== currentUser.id),
                }
            }

            return {
                ...post,
                reactions: reactions.map(r =>
                    r.userId === currentUser.id ? { ...r, type } : r
                ),
            }
        })
    }

    async function handleBookmark(postId) {
        const res = await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
            showToast(data.saved ? 'Saved to bookmarks' : 'Removed from bookmarks')
            if (activeTab === 'saved' && !data.saved) {
                setPosts(prev => prev.filter(post => post.id !== postId))
                return
            }

            updatePost(postId, post => {
                const bookmarks = post.bookmarks || []
                const currentCount = post._count?.bookmarks || 0

                return {
                    ...post,
                    bookmarks: data.saved
                        ? [...bookmarks, { id: `new-${postId}-${currentUser.id}`, userId: currentUser.id }]
                        : bookmarks.filter(b => b.userId !== currentUser.id),
                    _count: {
                        ...post._count,
                        bookmarks: data.saved ? currentCount + 1 : Math.max(0, currentCount - 1),
                    },
                }
            })
        }
    }

    async function handleAddComment(postId) {
        const text = commentInputs[postId] || ''
        if (!text.trim()) return
        const res = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
        if (res.ok) {
            const data = await res.json()
            setCommentInputs(prev => ({ ...prev, [postId]: '' }))
            updatePost(postId, post => ({
                ...post,
                comments: [...(post.comments || []), data.comment],
                _count: {
                    ...post._count,
                    comments: (post._count?.comments || 0) + 1,
                },
            }))
        }
    }

    async function handleDeleteComment(postId, commentId) {
        askConfirm('Delete this comment?', '', async () => {
            setConfirm(null)
            const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
            if (res.ok) {
                updatePost(postId, post => ({
                    ...post,
                    comments: (post.comments || []).filter(c => c.id !== commentId),
                    _count: {
                        ...post._count,
                        comments: Math.max(0, (post._count?.comments || 0) - 1),
                    },
                }))
            }
        })
    }

    async function handleFollow(userId, isFollowing) {
        await fetch(`/api/users/${userId}/follow`, {
            method: isFollowing ? 'DELETE' : 'POST',
        })
        showToast(isFollowing ? 'Unfollowed' : 'Now following ✨')
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, isFollowing: !isFollowing } : u
        ))
        setSearchResults(prev => prev.map(u =>
            u.id === userId ? { ...u, isFollowing: !isFollowing } : u
        ))
        loadPosts()
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    if (!currentUser) return null

    return (
        <div style={{ minHeight: '100vh', background: '#F5F0FF' }}>

            {/* NAVBAR */}
            <nav style={nav.bar}>
                <div style={nav.inner}>
                    <Link href="/feed" style={nav.brand}>✦ Creativo</Link>

                    <div style={nav.searchWrap}>
                        <input
                            type="search"
                            placeholder="Search creators…"
                            style={nav.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery.trim() && (
                            <div style={nav.searchPanel}>
                                {searching ? (
                                    <div style={nav.searchEmpty}>Searching...</div>
                                ) : searchResults.length === 0 ? (
                                    <div style={nav.searchEmpty}>No creators found</div>
                                ) : (
                                    searchResults.map(u => (
                                        <div key={u.id} style={nav.searchRow}>
                                            <Link
                                                href={`/profile/${u.id}`}
                                                style={nav.searchUser}
                                                onClick={() => setSearchQuery('')}
                                            >
                                                <Avatar user={u} size={36} />
                                                <div>
                                                    <div style={nav.searchName}>@{u.username}</div>
                                                    <div style={nav.searchMeta}>
                                                        {u._count.posts} posts · {u._count.followers} followers
                                                    </div>
                                                </div>
                                            </Link>
                                            <button
                                                style={u.isFollowing ? discover.followingBtn : discover.followBtn}
                                                onClick={() => handleFollow(u.id, u.isFollowing)}
                                            >
                                                {u.isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div style={nav.actions}>
                        <Link href="/stats" style={nav.statsBtn}>Stats</Link>
                        <Link href={`/profile/${currentUser.id}`} style={nav.profileBtn}>
                            <Avatar user={currentUser} size={32} />
                            <span style={nav.username}>@{currentUser.username}</span>
                        </Link>
                        <button onClick={handleLogout} style={nav.logoutBtn} title="Log out">
                            ⎋
                        </button>
                    </div>
                </div>
            </nav>

            {/* LAYOUT */}
            <div style={layout.wrap}>

                {/* LEFT SIDEBAR */}
                <aside style={layout.sidebar}>
                    <span style={sidebar.sectionTitle}>BROWSE</span>
                    <button
                        style={activeFilter === 'all' ? sidebar.btnActive : sidebar.btn}
                        onClick={() => setActiveFilter('all')}
                    >
                        All Posts
                    </button>
                    <hr style={sidebar.divider} />
                    <span style={sidebar.sectionTitle}>CATEGORIES</span>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <button
                            key={key}
                            style={activeFilter === key ? sidebar.btnActive : sidebar.btn}
                            onClick={() => setActiveFilter(key)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </aside>

                {/* MAIN FEED */}
                <main style={layout.main}>

                    {/* TABS */}
                    <div style={feed.tabs}>
                        <button
                            style={activeTab === 'feed' ? feed.tabActive : feed.tab}
                            onClick={() => setActiveTab('feed')}
                        >
                            ✦ My Feed
                        </button>
                        <button
                            style={activeTab === 'explore' ? feed.tabActive : feed.tab}
                            onClick={() => setActiveTab('explore')}
                        >
                            Explore All
                        </button>
                        <button
                            style={activeTab === 'saved' ? feed.tabActive : feed.tab}
                            onClick={() => setActiveTab('saved')}
                        >
                            Saved
                        </button>
                    </div>

                    {/* POST CREATION */}
                    <div style={create.card}>
                        <div style={create.header}>
                            <Avatar user={currentUser} size={40} />
                            <textarea
                                style={create.textarea}
                                placeholder="What creative expression are you feeling today? (200 characters max)"
                                maxLength={200}
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                rows={3}
                            />
                        </div>
                        {artPreview && (
                            <div style={create.previewWrap}>
                                <img src={artPreview} alt="Artwork preview" style={create.previewImage} />
                                <button onClick={clearArtFile} style={create.removeImageBtn}>
                                    Remove image
                                </button>
                            </div>
                        )}
                        <div style={create.footer}>
                            <div style={create.catBtns}>
                                {Object.entries(CATEGORIES).map(([key, cat]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedCat(key)}
                                        style={{
                                            ...create.catBtn,
                                            background: selectedCat === key ? 'rgba(127,119,221,0.15)' : '#FAF7FF',
                                            borderColor: selectedCat === key ? '#7F77DD' : '#E4DCF5',
                                            color: selectedCat === key ? '#7F77DD' : '#6B5BA0',
                                            fontWeight: selectedCat === key ? '600' : '400',
                                        }}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div style={create.actions}>
                                <label style={create.uploadBtn}>
                                    Show your art
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={handleArtFileChange}
                                    />
                                </label>
                                <span style={{ fontSize: '13px', color: '#A99BC7', fontWeight: '500' }}>
                                    {200 - postContent.length}
                                </span>
                                <button style={posting ? { ...create.postBtn, opacity: 0.7 } : create.postBtn} onClick={handleSubmitPost} disabled={posting}>
                                    {posting ? 'Posting...' : '✦ Post'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* POSTS LIST */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#A99BC7' }}>
                            Loading posts…
                        </div>
                    ) : posts.length === 0 ? (
                        <div style={emptyState.wrap}>
                            <div style={{ fontSize: '3rem' }}>🌱</div>
                            <h3 style={emptyState.h3}>Nothing here yet</h3>
                            <p style={emptyState.p}>
                                {activeTab === 'feed'
                                    ? 'Follow some creators to see their posts here!'
                                    : activeTab === 'saved'
                                        ? 'Bookmark posts to find them here later.'
                                        : 'Be the first to create!'}
                            </p>
                        </div>
                    ) : (
                        posts.map(post => {
                            const cat = CATEGORIES[post.category]
                            const isOwner = post.author.id === currentUser.id
                            const userReaction = post.reactions.find(r => r.userId === currentUser.id)
                            const inspireCount = post.reactions.filter(r => r.type === 'inspire').length
                            const appreciateCount = post.reactions.filter(r => r.type === 'appreciate').length
                            const isBookmarked = post.bookmarks?.some(b => b.userId === currentUser.id)
                            const bookmarkCount = post._count?.bookmarks || 0
                            const commentsOpen = openComments[post.id]

                            return (
                                <div key={post.id} style={card.wrap}>

                                    {/* CARD HEADER */}
                                    <div style={card.header}>
                                        <Link href={`/profile/${post.author.id}`} style={card.authorLink}>
                                            <Avatar user={post.author} size={40} />
                                            <div>
                                                <div style={card.authorName}>@{post.author.username}</div>
                                                <div style={card.timestamp}>{formatDate(post.createdAt)}</div>
                                            </div>
                                        </Link>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {cat && (
                                                <span style={{ ...card.badge, background: cat.bg, color: cat.color }}>
                                                    {cat.label}
                                                </span>
                                            )}
                                            {isOwner && (
                                                <button
                                                    style={card.deleteBtn}
                                                    onClick={() => handleDeletePost(post.id)}
                                                    title="Delete post"
                                                >
                                                    🗑
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    <p style={card.content}>{post.content}</p>
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            alt={`${post.author.username}'s artwork`}
                                            style={card.image}
                                        />
                                    )}

                                    {/* FOOTER */}
                                    <div style={card.footer}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                style={{
                                                    ...card.reactionBtn,
                                                    background: userReaction?.type === 'inspire' ? '#fde8ee' : 'transparent',
                                                    color: userReaction?.type === 'inspire' ? '#E07090' : '#6B5BA0',
                                                    border: userReaction?.type === 'inspire' ? '1.5px solid #f8c0ce' : '1.5px solid transparent',
                                                }}
                                                onClick={() => handleReact(post.id, 'inspire')}
                                            >
                                                ❤️ {inspireCount}
                                            </button>
                                            <button
                                                style={{
                                                    ...card.reactionBtn,
                                                    background: userReaction?.type === 'appreciate' ? '#fdf8e0' : 'transparent',
                                                    color: userReaction?.type === 'appreciate' ? '#D0A020' : '#6B5BA0',
                                                    border: userReaction?.type === 'appreciate' ? '1.5px solid #f0e090' : '1.5px solid transparent',
                                                }}
                                                onClick={() => handleReact(post.id, 'appreciate')}
                                            >
                                                ⭐ {appreciateCount}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                style={{
                                                    ...card.bookmarkBtn,
                                                    background: isBookmarked ? '#EEEDFE' : 'transparent',
                                                    color: isBookmarked ? '#3C3489' : '#6B5BA0',
                                                    border: isBookmarked ? '1.5px solid #C8B8E8' : '1.5px solid transparent',
                                                }}
                                                onClick={() => handleBookmark(post.id)}
                                            >
                                                🔖 {bookmarkCount}
                                            </button>
                                            <button
                                                style={card.commentBtn}
                                                onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                            >
                                                💬 {post._count.comments}
                                            </button>
                                        </div>
                                    </div>

                                    {/* COMMENTS SECTION */}
                                    {commentsOpen && (
                                        <div style={comments.section}>
                                            {post.comments && post.comments.length === 0 && (
                                                <p style={comments.empty}>No comments yet.</p>
                                            )}
                                            {post.comments && post.comments.map(c => (
                                                <div key={c.id} style={comments.row}>
                                                    <Avatar user={c.author} size={32} />
                                                    <div style={comments.body}>
                                                        <span style={comments.author}>@{c.author.username}</span>
                                                        <span style={comments.text}> {c.text}</span>
                                                        <span style={comments.time}>{formatDate(c.createdAt)}</span>
                                                    </div>
                                                    {c.author.id === currentUser.id && (
                                                        <button
                                                            style={comments.deleteBtn}
                                                            onClick={() => handleDeleteComment(post.id, c.id)}
                                                        >✕</button>
                                                    )}
                                                </div>
                                            ))}
                                            <div style={comments.form}>
                                                <Avatar user={currentUser} size={32} />
                                                <input
                                                    style={comments.input}
                                                    placeholder="Write a comment…"
                                                    maxLength={300}
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id) }}
                                                />
                                                <button style={comments.submitBtn} onClick={() => handleAddComment(post.id)}>
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )
                        })
                    )}
                </main>

                {/* RIGHT SIDEBAR — Discover Creators */}
                <aside style={layout.discoverSidebar}>
                    <h3 style={discover.title}>Suggested Creators</h3>
                    {users.map(u => (
                        <div key={u.id} style={discover.card}>
                            <Link href={`/profile/${u.id}`} style={discover.userInfo}>
                                <Avatar user={u} size={40} />
                                <div>
                                    <div style={discover.username}>@{u.username}</div>
                                    <div style={discover.postCount}>{u._count.posts} posts</div>
                                </div>
                            </Link>
                            <button
                                style={u.isFollowing ? discover.followingBtn : discover.followBtn}
                                onClick={() => handleFollow(u.id, u.isFollowing)}
                            >
                                {u.isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    ))}
                </aside>

            </div>

            {/* TOAST */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* CONFIRM DIALOG */}
            {confirm && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}

        </div>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const nav = {
    bar: { position: 'sticky', top: 0, zIndex: 100, height: '64px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(127,119,221,0.18)' },
    inner: { display: 'flex', alignItems: 'center', width: '100%', padding: '0 24px', gap: '16px' },
    brand: { fontSize: '20px', fontWeight: '600', color: '#3C3489', fontFamily: "'Cormorant Garamond', serif", flexShrink: 0, textDecoration: 'none' },
    searchWrap: { flex: 1, maxWidth: '800px', margin: '0 auto', position: 'relative' },
    searchInput: { width: '100%', padding: '9px 16px', background: '#FAF7FF', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '9999px', fontSize: '14px', color: '#231647', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
    searchPanel: { position: 'absolute', top: '44px', left: 0, right: 0, background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '18px', padding: '8px', boxShadow: '0 16px 40px rgba(100,60,180,0.16)', zIndex: 200 },
    searchRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '8px', borderRadius: '12px' },
    searchUser: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, textDecoration: 'none' },
    searchName: { fontSize: '13px', fontWeight: '600', color: '#231647' },
    searchMeta: { fontSize: '11px', color: '#A99BC7' },
    searchEmpty: { padding: '14px', textAlign: 'center', fontSize: '13px', color: '#A99BC7' },
    actions: { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 },
    statsBtn: { padding: '8px 14px', borderRadius: '9999px', color: '#6B5BA0', background: '#FAF7FF', border: '1px solid rgba(127,119,221,0.18)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
    profileBtn: { display: 'flex', alignItems: 'center', padding: '5px 12px 5px 5px', gap: '8px', borderRadius: '20px', textDecoration: 'none', transition: '0.2s' },
    username: { fontSize: '14px', fontWeight: '500', color: '#6B5BA0' },
    logoutBtn: { padding: '5px 12px', borderRadius: '20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6B5BA0' },
}

const layout = {
    wrap: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '28px', alignItems: 'start' },
    sidebar: { position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '4px' },
    main: { minWidth: 0 },
    discoverSidebar: { position: 'sticky', top: '88px', background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', padding: '16px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' },
}

const sidebar = {
    sectionTitle: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.1rem', color: '#2C2C2A', padding: '12px 12px 4px', display: 'block' },
    btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '20px', fontSize: '14px', color: '#888780', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' },
    btnActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '20px', fontSize: '14px', color: '#2C2C2A', fontWeight: '500', width: '100%', textAlign: 'left', background: 'rgba(127,119,221,0.18)', border: 'none', cursor: 'pointer' },
    divider: { height: '1px', background: 'rgba(127,119,221,0.18)', margin: '8px 12px', border: 'none' },
}

const feed = {
    tabs: { display: 'flex', gap: '4px', background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '20px', padding: '4px', marginBottom: '20px' },
    tab: { flex: 1, padding: '9px 16px', borderRadius: '14px', fontSize: '14px', color: '#6B5BA0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    tabActive: { flex: 1, padding: '9px 16px', borderRadius: '14px', fontSize: '14px', color: '#fff', fontWeight: '500', background: '#7F77DD', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const create = {
    card: { background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' },
    header: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' },
    textarea: { flex: 1, width: '100%', background: '#FAF7FF', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#231647', resize: 'none', minHeight: '80px', outline: 'none', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.6' },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' },
    catBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    catBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', border: '1.5px solid #E4DCF5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: '0.2s' },
    actions: { display: 'flex', alignItems: 'center', gap: '12px' },
    uploadBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF7FF', color: '#6B5BA0', borderRadius: '9999px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', border: '1.5px solid #E4DCF5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    postBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#7F77DD', color: '#fff', borderRadius: '9999px', padding: '10px 24px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    previewWrap: { marginLeft: '52px', marginBottom: '14px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(127,119,221,0.18)', background: '#FAF7FF' },
    previewImage: { display: 'block', width: '100%', maxHeight: '260px', objectFit: 'cover' },
    removeImageBtn: { position: 'absolute', right: '10px', top: '10px', border: 'none', borderRadius: '9999px', background: 'rgba(35,22,71,0.76)', color: '#fff', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const card = {
    wrap: { background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' },
    authorLink: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
    authorName: { fontSize: '14px', fontWeight: '600', color: '#231647' },
    timestamp: { fontSize: '12px', color: '#A99BC7' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.03em', whiteSpace: 'nowrap' },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#A99BC7', padding: '4px', borderRadius: '50%' },
    content: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontStyle: 'italic', color: '#231647', lineHeight: '1.75', letterSpacing: '0.01em', padding: '8px 0 4px', margin: 0 },
    image: { display: 'block', width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '8px', margin: '12px 0 4px', border: '1px solid rgba(127,119,221,0.18)' },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(127,119,221,0.18)', marginTop: '8px' },
    reactionBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: '0.2s', fontFamily: "'DM Sans', sans-serif" },
    bookmarkBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: '0.2s', fontFamily: "'DM Sans', sans-serif" },
    commentBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', color: '#6B5BA0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const comments = {
    section: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(127,119,221,0.18)' },
    empty: { fontSize: '13px', color: '#A99BC7', textAlign: 'center', padding: '8px 0', margin: 0 },
    row: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', position: 'relative' },
    body: { flex: 1, background: '#EEEDFE', borderRadius: '12px', padding: '7px 12px', fontSize: '13px', lineHeight: '1.5' },
    author: { fontWeight: '600', color: '#3C3489', marginRight: '6px' },
    text: { color: '#2C2C2A' },
    time: { display: 'block', fontSize: '11px', color: '#A99BC7', marginTop: '2px' },
    deleteBtn: { background: 'none', border: 'none', color: '#A99BC7', fontSize: '12px', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '4px' },
    form: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' },
    input: { flex: 1, padding: '8px 14px', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '9999px', fontSize: '13px', color: '#231647', background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
    submitBtn: { background: '#7F77DD', color: '#fff', border: 'none', borderRadius: '9999px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const discover = {
    title: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: '500', color: '#2C2C2A', padding: '0 8px 8px', margin: 0 },
    card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 8px', borderRadius: '14px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, textDecoration: 'none' },
    username: { fontSize: '13px', fontWeight: '600', color: '#231647' },
    postCount: { fontSize: '11px', color: '#A99BC7' },
    followBtn: { background: '#7F77DD', color: '#fff', border: 'none', borderRadius: '9999px', padding: '7px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
    followingBtn: { background: 'transparent', color: '#6B5BA0', border: '1.5px solid #C8B8E8', borderRadius: '9999px', padding: '7px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
}

const emptyState = {
    wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', gap: '12px' },
    h3: { fontFamily: "'Cormorant Garamond', serif", color: '#231647', margin: 0 },
    p: { fontSize: '14px', color: '#A99BC7', maxWidth: '300px', margin: 0 },
}

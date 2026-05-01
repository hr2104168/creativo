'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = {
  poetry:     { label: '✍️ Poetry',     bg: '#E8D5F5', color: '#6B3FA0' },
  story:      { label: '📖 Story',      bg: '#D5E5F5', color: '#2D70A0' },
  artidea:    { label: '🎨 Art Idea',   bg: '#F5E5D0', color: '#A05820' },
  prompt:     { label: '💡 Prompt',     bg: '#D5F0E0', color: '#28805A' },
  motivation: { label: '✨ Motivation', bg: '#F5D8E8', color: '#A03070' },
}

const AVATAR_COLORS = ['#B39DDB','#F48FB1','#80DEEA','#FFE082','#A5D6A7','#EF9A9A','#90CAF9','#CE93D8']

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
  if (diff < 60000)     return 'just now'
  if (diff < 3600000)   return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Avatar({ user, size = 40 }) {
  const fontSize = size <= 32 ? '11px' : size <= 40 ? '13px' : size <= 60 ? '18px' : '28px'
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
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#2C2C2A', marginBottom: '12px' }}>
          {title}
        </h3>
        {message && <p style={{ fontSize: '14px', color: '#6B5BA0', marginBottom: '20px', lineHeight: '1.6' }}>{message}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: '9999px', border: '1.5px solid #C8B8E8', background: 'transparent', color: '#6B5BA0', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: '9999px', border: 'none', background: '#E07070', color: '#fff', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSave, showToast }) {
  const [username, setUsername]         = useState(user.username)
  const [bio, setBio]                   = useState(user.bio || '')
  const [profilePic, setProfilePic]     = useState(user.profilePicture || '')
  const [previewUrl, setPreviewUrl]     = useState(user.profilePicture || '')
  const [error, setError]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [uploading, setUploading]       = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setError('Only JPEG, PNG, WebP, GIF allowed.'); return }
    if (file.size > 2 * 1024 * 1024)  { setError('Image must be under 2 MB.'); return }

    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    setError('')

    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed.'); setPreviewUrl(user.profilePicture || ''); return }
      setProfilePic(data.url)
    } catch {
      setError('Upload failed. Please try again.')
      setPreviewUrl(user.profilePicture || '')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:       username.trim(),
          bio:            bio.trim(),
          profilePicture: profilePic || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onSave(data.user)
      onClose()
      showToast('Profile updated ✨')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      zIndex: 500, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '28px',
        width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 16px 48px rgba(100,60,180,0.20)',
      }} onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(127,119,221,0.18)' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: '500', color: '#2C2C2A', margin: 0 }}>
            Edit Profile
          </h3>
          <button onClick={onClose} style={{ fontSize: '18px', color: '#A99BC7', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {error && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: '#FBEAF0', border: '1px solid #F4C0D1', borderRadius: '8px', fontSize: '13px', color: '#993556' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Profile Picture Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2C2C2A' }}>
              Profile Picture
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #EEEDFE' }}
                />
              )}
              {!previewUrl && (
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: getAvatarColor(user.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: '600' }}>
                  {getInitials(user.username)}
                </div>
              )}
              <label style={{
                width: '100%', border: '2px dashed #C8B8E8', borderRadius: '14px',
                padding: '20px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px', cursor: 'pointer',
                background: '#FAF7FF', textAlign: 'center',
              }}>
                <span style={{ fontSize: '1.6rem' }}>📷</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#3C3489' }}>
                  {uploading ? 'Uploading…' : previewUrl ? 'Change photo' : 'Upload photo'}
                </span>
                <span style={{ fontSize: '11px', color: '#A99BC7' }}>
                  Click to choose a file · Max 2 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="edit-username" style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2C2C2A' }}>
              Username
            </label>
            <input
              id="edit-username"
              type="text"
              style={{ padding: '11px 14px', background: '#FAF7FF', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '14px', fontSize: '14px', color: '#231647', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="edit-bio" style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2C2C2A' }}>
              Bio
            </label>
            <textarea
              id="edit-bio"
              style={{ padding: '11px 14px', background: '#FAF7FF', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '14px', fontSize: '14px', color: '#231647', outline: 'none', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', minHeight: '80px' }}
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Tell us about yourself…"
            />
            <span style={{ fontSize: '11px', color: '#A99BC7', textAlign: 'right' }}>
              {160 - bio.length} characters remaining
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '9999px', border: '1.5px solid #C8B8E8', background: 'transparent', color: '#6B5BA0', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading} style={{ padding: '10px 20px', borderRadius: '9999px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving || uploading ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router  = useRouter()
  const params  = useParams()
  const userId  = params.id

  const [currentUser, setCurrentUser]   = useState(null)
  const [profileUser, setProfileUser]   = useState(null)
  const [posts, setPosts]               = useState([])
  const [isFollowing, setIsFollowing]   = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast]               = useState(null)
  const [confirm, setConfirm]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [openComments, setOpenComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function askConfirm(title, message, onConfirm) {
    setConfirm({ title, message, onConfirm })
  }

  function updatePost(postId, changePost) {
    setPosts(prev => prev.map(post =>
      post.id === postId ? changePost(post) : post
    ))
  }

  // Load current logged-in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) { router.push('/'); return }
        setCurrentUser(data.user)
      })
      .catch(() => router.push('/'))
  }, [])

  // Load profile data
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.user) { router.push('/feed'); return }
        setProfileUser(data.user)
        setPosts(data.posts || [])
        setFollowerCount(data.user._count?.followers || 0)
      })
      .finally(() => setLoading(false))
  }, [userId])

  // Check if current user follows profile user
  useEffect(() => {
    if (!currentUser || !profileUser) return
    if (currentUser.id === profileUser.id) return
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        const found = data.users?.find(u => u.id === profileUser.id)
        if (found) setIsFollowing(found.isFollowing)
      })
  }, [currentUser, profileUser])

  async function handleFollow() {
    if (!profileUser) return
    const method = isFollowing ? 'DELETE' : 'POST'
    await fetch(`/api/users/${profileUser.id}/follow`, { method })
    setIsFollowing(!isFollowing)
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
    showToast(isFollowing ? 'Unfollowed' : 'Now following ✨')
  }

  async function handleDeletePost(postId) {
    askConfirm('Delete this post?', 'This cannot be undone.', async () => {
      setConfirm(null)
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (!currentUser || !profileUser) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#A99BC7', fontFamily: "'DM Sans', sans-serif" }}>
        {loading ? 'Loading profile…' : 'User not found.'}
      </div>
    )
  }

  const isOwn = currentUser.id === profileUser.id

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0FF' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: '64px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(127,119,221,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 24px', gap: '16px' }}>
          <Link href="/feed" style={{ fontSize: '20px', fontWeight: '600', color: '#3C3489', fontFamily: "'Cormorant Garamond', serif", flexShrink: 0, textDecoration: 'none' }}>
            ✦ Creativo
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/stats" style={{ padding: '8px 14px', borderRadius: '9999px', color: '#6B5BA0', background: '#FAF7FF', border: '1px solid rgba(127,119,221,0.18)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Stats
            </Link>
            <Link href={`/profile/${currentUser.id}`} style={{ display: 'flex', alignItems: 'center', padding: '5px 12px 5px 5px', gap: '8px', borderRadius: '20px', textDecoration: 'none' }}>
              <Avatar user={currentUser} size={32} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B5BA0' }}>@{currentUser.username}</span>
            </Link>
            <button onClick={handleLogout} style={{ padding: '5px 12px', borderRadius: '20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6B5BA0' }}>
              ⎋
            </button>
          </div>
        </div>
      </nav>

      {/* PAGE CONTAINER */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px', alignItems: 'start' }}>

          {/* LEFT — Profile Card */}
          <aside style={{ position: 'sticky', top: '88px' }}>
            <div style={{ background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', padding: '28px 24px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' }}>

              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', display: 'inline-block', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar user={profileUser} size={96} />
                </div>
                {isOwn && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{ position: 'absolute', bottom: 0, right: 'calc(50% - 48px)', background: '#7F77DD', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    📷
                  </button>
                )}
              </div>

              {/* Name & handle */}
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: '400', color: '#2C2C2A', margin: '0 0 4px 0' }}>
                  {profileUser.username}
                </h1>
                <p style={{ fontSize: '13px', color: '#A99BC7', margin: '0 0 16px 0' }}>
                  @{profileUser.username}
                </p>

                {/* Bio */}
                <div style={{ background: '#FAF7FF', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '14px', padding: '12px 14px', marginBottom: '20px', textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6B5BA0', margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>
                    {profileUser.bio || 'No bio yet.'}
                  </p>
                  {isOwn && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      style={{ fontSize: '12px', color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      ✎ Edit bio
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0', borderTop: '1px solid rgba(127,119,221,0.18)', borderBottom: '1px solid rgba(127,119,221,0.18)', marginBottom: '20px' }}>
                  {[
                    { number: posts.length,                  label: 'posts' },
                    { number: followerCount,                  label: 'followers' },
                    { number: profileUser._count?.following || 0, label: 'following' },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: '700', color: '#3C3489' }}>
                        {stat.number}
                      </span>
                      <span style={{ fontSize: '11px', color: '#A99BC7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {isOwn ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{ width: '100%', padding: '10px 20px', borderRadius: '9999px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    style={{
                      width: '100%', padding: '10px 20px', borderRadius: '9999px',
                      border: isFollowing ? '1.5px solid #C8B8E8' : 'none',
                      background: isFollowing ? 'transparent' : '#7F77DD',
                      color: isFollowing ? '#6B5BA0' : '#fff',
                      fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                {/* Join date */}
                {profileUser.createdAt && (
                  <p style={{ marginTop: '14px', fontSize: '12px', color: '#A99BC7', textAlign: 'center' }}>
                    Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT — Posts */}
          <main>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: '400', color: '#2C2C2A', marginBottom: '20px' }}>
              {isOwn ? '✨ My Creations' : `✨ ${profileUser.username}'s Posts`}
            </h2>

            {posts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center', background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', gap: '12px' }}>
                <div style={{ fontSize: '3rem' }}>🌱</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", color: '#231647', margin: 0 }}>No posts yet</h3>
                <p style={{ fontSize: '14px', color: '#A99BC7', margin: 0 }}>
                  {isOwn ? 'Head to the feed to share your first creation!' : "This creator hasn't posted yet."}
                </p>
                {isOwn && (
                  <Link href="/feed" style={{ marginTop: '8px', padding: '10px 24px', background: '#7F77DD', color: '#fff', borderRadius: '9999px', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
                    Go to Feed
                  </Link>
                )}
              </div>
            ) : (
              posts.map(post => {
                const cat          = CATEGORIES[post.category]
                const isPostOwner  = post.author.id === currentUser.id
                const userReaction = post.reactions?.find(r => r.userId === currentUser.id)
                const inspireCount    = post.reactions?.filter(r => r.type === 'inspire').length || 0
                const appreciateCount = post.reactions?.filter(r => r.type === 'appreciate').length || 0
                const isBookmarked = post.bookmarks?.some(b => b.userId === currentUser.id)
                const bookmarkCount = post._count?.bookmarks || 0
                const commentsOpen = openComments[post.id]

                return (
                  <div key={post.id} style={{ background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '28px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' }}>

                    {/* Post Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Link href={`/profile/${post.author.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <Avatar user={post.author} size={40} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#231647' }}>@{post.author.username}</div>
                          <div style={{ fontSize: '12px', color: '#A99BC7' }}>{formatDate(post.createdAt)}</div>
                        </div>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cat && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', background: cat.bg, color: cat.color, whiteSpace: 'nowrap' }}>
                            {cat.label}
                          </span>
                        )}
                        {isPostOwner && (
                          <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#A99BC7' }} title="Delete post">
                            🗑
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontStyle: 'italic', color: '#231647', lineHeight: '1.75', padding: '8px 0 4px', margin: 0 }}>
                      {post.content}
                    </p>

                    {/* Post Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(127,119,221,0.18)', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleReact(post.id, 'inspire')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: userReaction?.type === 'inspire' ? '#fde8ee' : 'transparent', color: userReaction?.type === 'inspire' ? '#E07090' : '#6B5BA0', border: userReaction?.type === 'inspire' ? '1.5px solid #f8c0ce' : '1.5px solid transparent' }}
                        >
                          ❤️ {inspireCount}
                        </button>
                        <button
                          onClick={() => handleReact(post.id, 'appreciate')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: userReaction?.type === 'appreciate' ? '#fdf8e0' : 'transparent', color: userReaction?.type === 'appreciate' ? '#D0A020' : '#6B5BA0', border: userReaction?.type === 'appreciate' ? '1.5px solid #f0e090' : '1.5px solid transparent' }}
                        >
                          ⭐ {appreciateCount}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleBookmark(post.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '9999px',
                            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            background: isBookmarked ? '#EEEDFE' : 'transparent',
                            color: isBookmarked ? '#3C3489' : '#6B5BA0',
                            border: isBookmarked ? '1.5px solid #C8B8E8' : '1.5px solid transparent',
                          }}
                        >
                          🔖 {bookmarkCount}
                        </button>
                        <button
                          onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '500', color: '#6B5BA0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          💬 {post._count?.comments || 0}
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    {commentsOpen && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(127,119,221,0.18)' }}>
                        {(!post.comments || post.comments.length === 0) && (
                          <p style={{ fontSize: '13px', color: '#A99BC7', textAlign: 'center', padding: '8px 0', margin: 0 }}>No comments yet.</p>
                        )}
                        {post.comments && post.comments.map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                            <Avatar user={c.author} size={32} />
                            <div style={{ flex: 1, background: '#EEEDFE', borderRadius: '12px', padding: '7px 12px', fontSize: '13px', lineHeight: '1.5' }}>
                              <span style={{ fontWeight: '600', color: '#3C3489', marginRight: '6px' }}>@{c.author.username}</span>
                              <span style={{ color: '#2C2C2A' }}>{c.text}</span>
                              <span style={{ display: 'block', fontSize: '11px', color: '#A99BC7', marginTop: '2px' }}>{formatDate(c.createdAt)}</span>
                            </div>
                            {c.author.id === currentUser.id && (
                              <button onClick={() => handleDeleteComment(post.id, c.id)} style={{ background: 'none', border: 'none', color: '#A99BC7', fontSize: '12px', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>✕</button>
                            )}
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <Avatar user={currentUser} size={32} />
                          <input
                            style={{ flex: 1, padding: '8px 14px', border: '1.5px solid rgba(127,119,221,0.18)', borderRadius: '9999px', fontSize: '13px', color: '#231647', background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
                            placeholder="Write a comment…"
                            maxLength={300}
                            value={commentInputs[post.id] || ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id) }}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: '9999px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                          >
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

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onSave={updatedUser => {
            setProfileUser(prev => ({ ...prev, ...updatedUser }))
          }}
          showToast={showToast}
        />
      )}

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

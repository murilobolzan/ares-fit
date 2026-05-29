'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Heart, MessageCircle, Share2, UserPlus, Flame, Trophy, Dumbbell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SocialFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadFeed() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Busca posts (com likes e comments contados dinamicamente via DB, mas aqui faremos join padrão)
      const { data } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles(full_name, username),
          workout_sessions(name, total_volume_kg, rating),
          post_likes(user_id)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (data) setPosts(data);
      setLoading(false);
    }
    loadFeed();
  }, []);

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    // Optimistic UI
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
          post_likes: isLiked 
            ? p.post_likes.filter((l: any) => l.user_id !== currentUser.id)
            : [...p.post_likes, { user_id: currentUser.id }]
        };
      }
      return p;
    }));

    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      await supabase.rpc('decrement_likes', { p_id: postId }); // Opcional se tiver RPC, senão o count resolve local
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
      await supabase.rpc('increment_likes', { p_id: postId });
    }
  };

  const handleFollow = async (followingId: string) => {
    if (!currentUser) return;
    await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: followingId });
    alert('Seguindo!');
  };

  if (loading) return <div className="min-h-screen bg-black text-white p-6 flex justify-center items-center"><Flame className="w-8 h-8 text-[#FFE600] animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-xl mx-auto space-y-6 pb-20">
      <header className="py-2">
        <h1 className="text-2xl font-black uppercase tracking-tight">Comunidade</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Inspire e seja inspirado.</p>
      </header>

      <div className="space-y-4">
        {posts.map((post) => {
          const isLikedByMe = currentUser && post.post_likes?.some((l: any) => l.user_id === currentUser.id);
          const initials = post.profiles?.full_name?.substring(0, 2).toUpperCase() || 'AF';
          const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

          return (
            <div key={post.id} className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black border border-[#222225] rounded-full flex items-center justify-center font-black text-xs text-[#FFE600]">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1">
                      {post.profiles?.full_name || 'Atleta'} 
                      {post.post_type === 'workout' && <Dumbbell className="w-3 h-3 text-[#A1A1AA]" />}
                      {post.post_type === 'pr' && <Trophy className="w-3 h-3 text-[#FFE600]" />}
                    </h3>
                    <p className="text-[10px] text-[#555558]">@{post.profiles?.username || 'user'} • {timeAgo}</p>
                  </div>
                </div>
                {currentUser?.id !== post.user_id && (
                  <button onClick={() => handleFollow(post.user_id)} className="w-8 h-8 flex items-center justify-center bg-[#1A1A1A] rounded-full text-[#A1A1AA] hover:text-white">
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>

              {/* Session Metrics Attachment */}
              {post.workout_sessions && (
                <div className="bg-black border border-[#222225] p-3 rounded-xl flex justify-around text-center">
                  <div>
                    <p className="text-[10px] font-bold text-[#A1A1AA] uppercase">Volume</p>
                    <p className="text-sm font-black text-[#FFE600]">{post.workout_sessions.total_volume_kg}kg</p>
                  </div>
                  <div className="w-px bg-[#222225]"></div>
                  <div>
                    <p className="text-[10px] font-bold text-[#A1A1AA] uppercase">Avaliação</p>
                    <p className="text-sm font-black text-[#FFE600]">{post.workout_sessions.rating ? post.workout_sessions.rating/2 : 5}/5</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id, isLikedByMe)} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLikedByMe ? 'text-red-500' : 'text-[#A1A1AA] hover:text-white'}`}>
                    <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-red-500' : ''}`} />
                    {post.likes_count || 0}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    {post.comments_count || 0}
                  </button>
                </div>
                <button className="text-[#555558] hover:text-white">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
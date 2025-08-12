import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserAndTweets();
  }, []);

  const fetchUserAndTweets = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUser(user);

      // Fetch tweets with user info
      const { data: tweetsData, error: tweetsError } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (tweetsError) throw tweetsError;
      setTweets(tweetsData || []);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostTweet = async () => {
    if (!newTweet.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tweets')
        .insert([{ 
          content: newTweet.trim(),
          user_id: user.id 
        }])
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;

      setTweets(prev => [data, ...prev]);
      setNewTweet('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('tweet_id', tweetId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('tweet_id', tweetId)
          .eq('user_id', user.id);

        setTweets(prev => prev.map(tweet => 
          tweet.id === tweetId 
            ? { ...tweet, likes_count: Math.max(0, tweet.likes_count - 1) }
            : tweet
        ));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ tweet_id: tweetId, user_id: user.id }]);

        setTweets(prev => prev.map(tweet => 
          tweet.id === tweetId 
            ? { ...tweet, likes_count: tweet.likes_count + 1 }
            : tweet
        ));
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Social Media Dashboard</h1>
        <div className={styles.userInfo}>
          <img 
            src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'} 
            alt="Avatar" 
            className={styles.avatar}
          />
          <span>{user?.user_metadata?.username || 'User'}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.tweetComposer}>
            <h3>What's on your mind?</h3>
            <textarea
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength="280"
              className={styles.textarea}
            />
            <div className={styles.composerFooter}>
              <span className={styles.charCount}>{newTweet.length}/280</span>
              <button 
                onClick={handlePostTweet}
                disabled={!newTweet.trim()}
                className={styles.postBtn}
              >
                Post
              </button>
            </div>
          </div>
        </aside>

        <section className={styles.content}>
          <h2>Recent Tweets</h2>
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.tweets}>
            {tweets.map(tweet => (
              <div key={tweet.id} className={styles.tweetCard}>
                <div className={styles.tweetHeader}>
                  <strong>@{tweet.profiles?.username || 'Anonymous'}</strong>
                  <span>·</span>
                  <span className={styles.timestamp}>
                    {new Date(tweet.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.tweetContent}>
                  {tweet.content}
                </div>
                <div className={styles.tweetStats}>
                  <span onClick={() => handleLike(tweet.id)}>
                    ❤️ {tweet.likes_count || 0}
                  </span>
                  <span>💬 {tweet.replies_count || 0}</span>
                  <span>🔄 {tweet.retweets_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
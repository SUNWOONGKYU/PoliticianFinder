#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
커뮤니티 페이지를 실제 API를 호출하도록 수정
"""

file_path = '1_Frontend/src/app/community/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useEffect to imports (line 2)
content = content.replace(
    "import { useState, useMemo } from 'react';",
    "import { useState, useMemo, useEffect } from 'react';"
)

# 2. Replace SAMPLE_POSTS with posts state and API fetch
old_code = '''export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<'all' | 'politician_post' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let posts = SAMPLE_POSTS;'''

new_code = '''export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(SAMPLE_POSTS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<'all' | 'politician_post' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/posts?limit=100', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPosts(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;'''

content = content.replace(old_code, new_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Community page updated to fetch posts from API!")
print("Changes made:")
print("  1. Added useEffect to imports")
print("  2. Added posts state and loading state")
print("  3. Added useEffect to fetch posts from /api/posts")
print("  4. Changed SAMPLE_POSTS to posts in filteredPosts")

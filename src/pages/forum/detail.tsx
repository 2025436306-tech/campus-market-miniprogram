import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function ForumDetail() {
  const router = useRouter();
  const { id } = router.params; 
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useShareAppMessage(() => {
    return { title: post?.content || '分享了一条校园动态', path: `/pages/forum/detail?id=${id}` };
  });

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) setCurrentUser(userInfo);

    // 新增：读取该帖子是否被点赞过
    const storedLikes = Taro.getStorageSync('liked_forum_posts') || [];
    if (id && storedLikes.includes(id)) {
      setIsLiked(true);
    }

    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const db = Taro.cloud.database();
      const postRes = await db.collection('forum_posts').doc(id).get();
      setPost(postRes.data);
      setLikesCount(postRes.data.likes || 0);

      const commentsRes = await db.collection('forum_comments').where({ postId: id }).orderBy('createTime', 'asc').get();
      setComments(commentsRes.data);
    } catch (error) {
      console.error('获取详情失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = () => {
    if (!currentUser) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '发表评论',
      editable: true,
      placeholderText: '说点什么吧...',
      success: async (res) => {
        if (res.confirm && res.content) {
          Taro.showLoading({ title: '发送中...' });
          try {
            const db = Taro.cloud.database();
            const newComment = {
              postId: id,
              userName: currentUser.nickName,
              userAvatar: currentUser.avatarUrl,
              content: res.content,
              timeStr: '刚刚',
              createTime: db.serverDate()
            };
            const addRes = await db.collection('forum_comments').add({ data: newComment });
            await db.collection('forum_posts').doc(id).update({ data: { comments: db.command.inc(1) } });
            
            setComments([...comments, { ...newComment, _id: addRes._id }]);
            Taro.hideLoading();
            Taro.showToast({ title: '评论成功', icon: 'success' });
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '发送失败', icon: 'error' });
          }
        }
      }
    });
  };

  // 新增：删除评论逻辑
  const handleDeleteComment = (commentId: string) => {
    Taro.showModal({
      title: '删除评论',
      content: '确定要删除这条评论吗？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '删除中...' });
          try {
            const db = Taro.cloud.database();
            // 1. 删除评论记录
            await db.collection('forum_comments').doc(commentId).remove();
            // 2. 帖子总评论数 -1
            await db.collection('forum_posts').doc(id).update({ data: { comments: db.command.inc(-1) } });
            // 3. 更新本地 UI
            setComments(comments.filter(c => c._id !== commentId));
            Taro.hideLoading();
            Taro.showToast({ title: '已删除', icon: 'success' });
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '删除失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleLike = async () => {
    if (!currentUser) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const newLikes = isLiked ? likesCount - 1 : likesCount + 1;
    setIsLiked(!isLiked);
    setLikesCount(newLikes); 

    // 新增：同步更新本地缓存，防止退出重进后丢失状态
    const storedLikes = Taro.getStorageSync('liked_forum_posts') || [];
    const newLikedPosts = isLiked 
      ? storedLikes.filter((pid: string) => pid !== id)
      : [...storedLikes, id];
    Taro.setStorageSync('liked_forum_posts', newLikedPosts);

    try {
      const db = Taro.cloud.database();
      await db.collection('forum_posts').doc(id).update({ data: { likes: newLikes } });
    } catch (err) {
      console.error('点赞失败', err);
    }
  };

  if (isLoading) return <View className="h-screen flex items-center justify-center bg-white"><Text className="text-lg text-zinc-500">加载中...</Text></View>;
  if (!post) return <View className="h-screen flex items-center justify-center bg-white"><Text className="text-lg text-zinc-500">动态已删除</Text></View>;

  return (
    <View className="flex flex-col h-screen bg-white relative">
      <ScrollView scrollY className="flex-1 pb-24">
        {/* 正文区域 */}
        <View className="px-5 pt-6 pb-4 border-b border-zinc-50">
          <View className="flex items-center mb-5">
            <Image src={post.authorAvatar || getIcon('user', '#2563EB')} className="w-14 h-14 rounded-full bg-zinc-100 object-cover" />
            <View className="ml-4">
              <Text className="text-xl font-bold text-zinc-900 block">{post.author}</Text>
              <Text className="text-sm text-zinc-400 mt-1 block">{post.timeStr || '刚刚'}</Text>
            </View>
            <View className="ml-auto px-2 py-1 bg-blue-50 rounded"><Text className="text-blue-500 text-xs font-bold">{post.tag}</Text></View>
          </View>
          
          <Text className="text-xl text-zinc-800 leading-relaxed block mb-4">{post.content}</Text>
          {post.imageUrl && <Image src={post.imageUrl} mode="widthFix" className="w-full rounded-xl" />}
        </View>

        {/* 评论列表 */}
        <View className="px-5 py-6 bg-zinc-50 min-h-screen">
          <Text className="text-lg font-bold text-zinc-800 mb-6 block">全部评论 ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text className="text-zinc-400 text-center block mt-10">还没有评论，快来抢沙发！</Text>
          ) : (
            comments.map((cmt) => (
              <View key={cmt._id} className="flex mb-6">
                <Image src={cmt.userAvatar || getIcon('user', '#A1A1AA')} className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 object-cover" />
                <View className="ml-4 flex-1 border-b border-zinc-200/50 pb-6">
                  
                  {/* 新增：增加头部排版，让作者标识和删除按钮并排 */}
                  <View className="flex justify-between items-center mb-1">
                    <Text className="text-base font-bold text-zinc-500">
                      {cmt.userName} {post.author === cmt.userName && <Text className="text-xs text-blue-500 bg-blue-50 px-1 ml-1 rounded">作者</Text>}
                    </Text>
                    {currentUser && currentUser.nickName === cmt.userName && (
                      <Text className="text-sm text-red-400 cursor-pointer active:opacity-60" onClick={() => handleDeleteComment(cmt._id)}>
                        删除
                      </Text>
                    )}
                  </View>

                  <Text className="text-lg text-zinc-900 block leading-relaxed">{cmt.content}</Text>
                  <Text className="text-xs text-zinc-400 block mt-2">{cmt.timeStr}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 底部互动栏 */}
      <View className="absolute bottom-0 left-0 w-full bg-white border-t border-zinc-100 px-5 py-3 pb-8 flex items-center justify-between z-50">
        <View className="flex-1 bg-zinc-100 rounded-full px-5 py-3 flex items-center cursor-pointer active:bg-zinc-200" onClick={handleAddComment}>
          <Image src={getIcon('edit-3', '#71717A')} className="w-5 h-5 mr-2" />
          <Text className="text-zinc-500 text-base">说点什么...</Text>
        </View>
        <View className="flex items-center space-x-6 ml-6 pr-2">
          
          <View className="flex flex-col items-center cursor-pointer active:opacity-60" onClick={handleLike}>
            <Image src={getIcon('heart', isLiked ? '#EF4444' : '#3F3F46')} className="w-7 h-7 mb-1 transition-colors" />
            <Text className={`text-[10px] font-medium ${isLiked ? 'text-red-500' : 'text-zinc-600'}`}>{likesCount || '点赞'}</Text>
          </View>

          <Button openType="share" className="m-0 p-0 bg-transparent flex flex-col items-center leading-none border-none after:border-none">
             <Image src={getIcon('share-2', '#3F3F46')} className="w-7 h-7 mb-1" />
             <Text className="text-[10px] text-zinc-600 font-medium">分享</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

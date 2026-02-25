import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function ChatDetail() {
  const router = useRouter();
  const targetName = decodeURIComponent(router.params.name || '联系人');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scrollId, setScrollId] = useState('');

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: targetName });
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) setCurrentUser(userInfo);

    const db = Taro.cloud.database();
    const watcher = db.collection('chat_records')
      .where(
        db.command.or([
          { sender: userInfo?.nickName, receiver: targetName },
          { sender: targetName, receiver: userInfo?.nickName }
        ])
      )
      .watch({
        onChange: function(snapshot) {
          if (snapshot.type === 'init' || snapshot.docChanges.length > 0) {
            
            // 核心修复：如果云端没数据，让里面的记录和外面的兜底数据保持一致！
            if (snapshot.docs.length === 0) {
              if (targetName.includes('李四')) {
                setMessages([{ id: 'm1', isMe: false, text: '那本书还在的，你什么时候方便过来拿？', time: '10:42' }]);
              } else if (targetName.includes('考研')) {
                setMessages([{ id: 'm1', isMe: false, text: '笔记我已经拍下来发你了，注意查收。', time: '昨天' }]);
              } else if (targetName.includes('官方')) {
                setMessages([{ id: 'm1', isMe: false, text: '您的宝贝「AirPods Pro」被 5 位同学收藏啦，快去看看！', time: '周二' }]);
              } else {
                setMessages([{ id: 'm1', isMe: false, text: '你好！', time: '刚刚' }]);
              }
            } else {
              const formattedMsgs = snapshot.docs.map(doc => ({
                id: doc._id,
                isMe: doc.sender === userInfo?.nickName,
                text: doc.text,
                time: doc.createTime ? new Date(doc.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '刚刚'
              }));
              formattedMsgs.sort((a, b) => a.id.localeCompare(b.id)); 
              setMessages(formattedMsgs);
            }
            setTimeout(() => scrollToBottom(), 200);
          }
        },
        onError: function(err) {
          console.error('实时监听失败', err);
        }
      });

    return () => watcher.close();
  }, [targetName]);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      setScrollId(`msg-${messages[messages.length - 1].id}`);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newText = inputText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: Date.now().toString(),
      isMe: true,
      text: newText,
      time: nowTime
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setTimeout(() => setScrollId(`msg-${newMsg.id}`), 100);

    try {
      const db = Taro.cloud.database();
      
      // 1. 将具体聊天记录写入 chat_records 表
      await db.collection('chat_records').add({
        data: {
          sender: currentUser?.nickName || '我',
          receiver: targetName,
          text: newText,
          createTime: db.serverDate()
        }
      });

      // 2. 核心修复：同步更新外面的消息列表 message_sessions 表！
      const sessionRes = await db.collection('message_sessions').where({ name: targetName }).get();
      if (sessionRes.data.length > 0) {
        // 如果外部列表已有这个人，更新最后一条消息内容和时间
        await db.collection('message_sessions').doc(sessionRes.data[0]._id).update({
          data: {
            msg: newText,
            time: nowTime,
            updateTime: db.serverDate()
          }
        });
      } else {
        // 如果外部列表没有这个人，直接新建一个会话
        await db.collection('message_sessions').add({
          data: {
            name: targetName,
            avatar: '', 
            msg: newText,
            time: nowTime,
            unread: 0,
            isSystem: false,
            updateTime: db.serverDate()
          }
        });
      }

    } catch (e) {
      console.log('写入云数据库失败', e);
    }
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      <View className="bg-yellow-50 px-5 py-4 flex items-center justify-center shrink-0">
        <Image src={getIcon('shield-alert', '#CA8A04')} className="w-6 h-6 mr-2" />
        <Text className="text-base text-yellow-700 font-medium">平台提醒：请在校园内当面交易，切勿轻信先款后货。</Text>
      </View>

      <ScrollView scrollY className="flex-1 px-5 pt-6 pb-8" scrollIntoView={scrollId} scrollWithAnimation>
        {messages.map((msg) => (
          <View id={`msg-${msg.id}`} key={msg.id} className={`flex mb-8 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <View 
              className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${msg.isMe ? 'bg-blue-100 ml-4' : 'bg-zinc-200 mr-4'} ${!msg.isMe ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
              onClick={() => {
                if (!msg.isMe) Taro.navigateTo({ url: `/pages/seller/index?name=${encodeURIComponent(targetName)}` });
              }}
            >
              <Image src={msg.isMe && currentUser?.avatarUrl ? currentUser.avatarUrl : getIcon('user', msg.isMe ? '#2563EB' : '#A1A1AA')} className="w-full h-full rounded-full object-cover" />
            </View>
            
            <View className={`max-w-[75%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <View className={`px-5 py-4 rounded-3xl ${msg.isMe ? 'bg-blue-600 rounded-tr-none' : 'bg-white rounded-tl-none border border-zinc-100 shadow-sm'}`}>
                <Text className={`text-xl leading-relaxed ${msg.isMe ? 'text-white' : 'text-zinc-800'}`}>
                  {msg.text}
                </Text>
              </View>
              <Text className="text-sm text-zinc-400 mt-2 px-2">{msg.time}</Text>
            </View>
          </View>
        ))}
        <View className="h-6"></View>
      </ScrollView>

      <View className="bg-white border-t border-zinc-200/50 px-5 py-4 pb-10 shrink-0 flex items-end">
        <View className="bg-zinc-100 rounded-3xl flex-1 flex items-center px-5 py-3.5 min-h-[56px]">
          <Input value={inputText} onInput={(e) => setInputText(e.detail.value)} className="flex-1 text-xl text-zinc-800 h-8" placeholder="发消息..." placeholderTextColor="#A1A1AA" confirmType="send" onConfirm={handleSend} cursorSpacing={20} />
        </View>
        <View className={`ml-4 w-16 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${inputText.trim() ? 'bg-blue-600' : 'bg-zinc-200'}`} onClick={handleSend}>
          <Image src={getIcon('send', '#FFFFFF')} className="w-8 h-8 ml-1" />
        </View>
      </View>
    </View>
  );
}

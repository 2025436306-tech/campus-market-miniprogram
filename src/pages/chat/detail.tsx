import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

// 使用 Icons8 PNG 接口，徹底解決真機不顯示圖標問題
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = { 'user': 'user', 'shield-alert': 'security-warning', 'send': 'paper-plane' };
  return `https://img.icons8.com/ios-filled/64/${hex}/${map[name] || 'round'}.png`;
};

// 安全的時間格式化函數
const formatTime = (dateObj: Date) => {
  const h = dateObj.getHours().toString().padStart(2, '0');
  const m = dateObj.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
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
          { sender: userInfo ? userInfo.nickName : '', receiver: targetName },
          { sender: targetName, receiver: userInfo ? userInfo.nickName : '' }
        ])
      )
      .watch({
        onChange: function (snapshot) {
          if (snapshot.type === 'init' || snapshot.docChanges.length > 0) {
            if (snapshot.docs.length === 0) {
              if (targetName === '官方客服') {
                setMessages([{ id: 'm1', isMe: false, text: '您好！这里是拾集校园官方客服，请问有什么可以帮您？', time: formatTime(new Date()) }]);
              } else {
                setMessages([{ id: 'm1', isMe: false, text: '你好！', time: formatTime(new Date()) }]);
              }
            } else {
              const formattedMsgs = snapshot.docs.map(doc => ({
                id: doc._id,
                isMe: doc.sender === (userInfo ? userInfo.nickName : ''),
                text: doc.text,
                time: doc.createTime ? formatTime(new Date(doc.createTime)) : formatTime(new Date())
              }));
              formattedMsgs.sort((a, b) => a.id.localeCompare(b.id));
              setMessages(formattedMsgs);
            }
            setTimeout(() => scrollToBottom(), 200);
          }
        },
        onError: function (err) { }
      });

    return () => watcher.close();
  }, [targetName]);

  const scrollToBottom = () => {
    if (messages.length > 0) setScrollId(`msg-${messages[messages.length - 1].id}`);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const newText = inputText.trim();
    const nowTime = formatTime(new Date());
    const newMsg = { id: Date.now().toString(), isMe: true, text: newText, time: nowTime };

    setMessages([...messages, newMsg]);
    setInputText('');
    setTimeout(() => setScrollId(`msg-${newMsg.id}`), 100);

    const db = Taro.cloud.database();
    const senderName = (currentUser && currentUser.nickName) || '我';

    try {
      // 1. 發送用戶的消息
      await db.collection('chat_records').add({
        data: { sender: senderName, receiver: targetName, text: newText, createTime: db.serverDate() }
      });

      const sessionRes = await db.collection('message_sessions').where({ name: targetName }).get();
      if (sessionRes.data.length > 0) {
        await db.collection('message_sessions').doc(sessionRes.data[0]._id).update({
          data: { msg: newText, time: nowTime, updateTime: db.serverDate() }
        });
      } else {
        await db.collection('message_sessions').add({
          data: { name: targetName, avatar: '', msg: newText, time: nowTime, unread: 0, isSystem: false, updateTime: db.serverDate() }
        });
      }

      // 2. ===== 官方客服自動回覆邏輯 =====
      if (targetName === '官方客服') {
        setTimeout(async () => {
          try {
            const replyMsg = '已经收到您的反馈啦！客服小助手已记录，稍后会有专人为您跟随处理，请耐心等待哦~';
            const replyTime = formatTime(new Date());

            // 寫入客服的回覆
            await db.collection('chat_records').add({
              data: { sender: '官方客服', receiver: senderName, text: replyMsg, createTime: db.serverDate() }
            });

            // 更新會話列表並增加未讀紅點
            const csSessionRes = await db.collection('message_sessions').where({ name: '官方客服' }).get();
            if (csSessionRes.data.length > 0) {
              await db.collection('message_sessions').doc(csSessionRes.data[0]._id).update({
                data: { msg: replyMsg, time: replyTime, updateTime: db.serverDate(), unread: db.command.inc(1) }
              });
            }
          } catch (e) {
            console.log('自动回复失败', e);
          }
        }, 1500); // 延遲 1.5 秒回覆，模擬真人打字
      }

    } catch (e) {
      console.log('发送失败', e);
    }
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      <View className="bg-yellow-50 px-4 py-2.5 flex items-center justify-center shrink-0">
        <Image src={getIcon('shield-alert', '#CA8A04')} className="w-4 h-4 mr-1.5" />
        <Text className="text-xs text-yellow-700 font-medium text-center">平台提醒：请在校园内当面交易，切勿轻信先款后货。</Text>
      </View>

      <ScrollView scrollY className="flex-1 px-4 pt-4 pb-6" scrollIntoView={scrollId} scrollWithAnimation>
        {messages.map((msg) => (
          <View id={`msg-${msg.id}`} key={msg.id} className={`flex mb-6 w-full box-border ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <View className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.isMe ? 'bg-blue-100 ml-3' : 'bg-zinc-200 mr-3'}`}>
              <Image src={msg.isMe && currentUser && currentUser.avatarUrl ? currentUser.avatarUrl : getIcon('user', msg.isMe ? '#2563EB' : '#A1A1AA')} className="w-full h-full rounded-full object-cover" />
            </View>

            <View className={`max-w-[70%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <View className={`px-4 py-2.5 rounded-2xl ${msg.isMe ? 'bg-blue-600 rounded-tr-none' : 'bg-white rounded-tl-none border border-zinc-100 shadow-sm'}`}>
                <Text className={`text-base leading-relaxed break-words ${msg.isMe ? 'text-white' : 'text-zinc-800'}`}>
                  {msg.text}
                </Text>
              </View>
              <Text className="text-xs text-zinc-400 mt-1.5 px-1">{msg.time}</Text>
            </View>
          </View>
        ))}
        <View className="h-4"></View>
      </ScrollView>

      <View className="bg-white border-t border-zinc-200/50 px-4 py-3 pb-8 shrink-0 flex items-end">
        <View className="bg-zinc-100 rounded-full flex-1 flex items-center px-4 py-2.5 min-h-[40px]">
          <Input value={inputText} onInput={(e) => setInputText(e.detail.value)} className="flex-1 text-base text-zinc-800 h-6" placeholder="發消息..." placeholderTextColor="#A1A1AA" confirmType="send" onConfirm={handleSend} cursorSpacing={20} />
        </View>
        <View className={`ml-3 w-14 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm ${inputText.trim() ? 'bg-blue-600' : 'bg-zinc-200'}`} onClick={handleSend}>
          <Text className="text-white text-sm font-bold">发送</Text>
        </View>
      </View>
    </View>
  );
}

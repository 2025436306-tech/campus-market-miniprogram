import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, Image, ScrollView, Picker, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

// 强制纯 PNG 图标，彻底解决真机不显示问题
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = { 'camera': 'camera', 'layers': 'layers', 'sparkles': 'sparkles', 'dollar-sign': 'dollar', 'scissors': 'scissors', 'chevron-right': 'chevron-right' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

export default function Publish() {
  const router = useRouter();
  const editId = router.params.id;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [isBargain, setIsBargain] = useState(false);

  const categories = ['图书资料', '数码电子', '生活好物', '服饰美妆', '其他'];
  const [categoryIndex, setCategoryIndex] = useState(0);
  const conditions = ['全新', '几乎全新', '九成新', '八成新', '七成新及以下'];
  const [conditionIndex, setConditionIndex] = useState(2);

  const categoryMap: { [key: string]: string } = {
    '图书资料': 'book', '数码电子': 'digital', '生活好物': 'daily', '服饰美妆': 'clothes', '其他': 'other'
  };
  const reverseCategoryMap: any = { 'book': 0, 'digital': 1, 'daily': 2, 'clothes': 3, 'other': 4 };

  useEffect(() => {
    if (editId) {
      Taro.setNavigationBarTitle({ title: '编辑宝贝' });
      Taro.showLoading({ title: '加载中...' });

      const db = Taro.cloud.database();
      db.collection('products').doc(editId).get().then(res => {
        const data = res.data;
        setTitle(data.title);
        setDesc(data.description || '');
        setPrice(data.price.toString());
        setImagePath(data.imageUrl);
        setIsBargain(data.isBargain || false);

        if (data.category && reverseCategoryMap[data.category] !== undefined) {
          setCategoryIndex(reverseCategoryMap[data.category]);
        }
        const condIdx = conditions.indexOf(data.tag);
        if (condIdx !== -1) setConditionIndex(condIdx);

        Taro.hideLoading();
      }).catch(err => {
        Taro.hideLoading();
      });
    }
  }, [editId]);

  const handleUploadImage = async () => {
    try {
      const res = await Taro.chooseMedia({ count: 1, mediaType: ['image'] });
      setImagePath(res.tempFiles[0].tempFilePath);
    } catch (e) { }
  };

  const handleSubmit = async () => {
    if (!title || !price || !imagePath) {
      Taro.showToast({ title: '请填写标题、价格并上传图片', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: editId ? '保存中...' : '发布中...', mask: true });

    try {
      const userInfo = Taro.getStorageSync('userInfo');
      const sellerName = userInfo ? userInfo.nickName : '未知卖家';
      let cloudImgUrl = imagePath;

      if (!imagePath.startsWith('cloud://') && !imagePath.startsWith('http')) {
        const cloudPath = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
        const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: imagePath });
        try {
          const urlRes = await Taro.cloud.getTempFileURL({ fileList: [uploadRes.fileID] });
          if (urlRes.fileList && urlRes.fileList.length > 0 && urlRes.fileList[0].tempFileURL) {
            cloudImgUrl = urlRes.fileList[0].tempFileURL;
          } else { cloudImgUrl = uploadRes.fileID; }
        } catch (e) { cloudImgUrl = uploadRes.fileID; }
      }

      const categoryId = categoryMap[categories[categoryIndex]] || 'other';
      const db = Taro.cloud.database();
      const productData = {
        title, description: desc, price: parseFloat(price), imageUrl: cloudImgUrl,
        category: categoryId, tag: conditions[conditionIndex], seller: sellerName, isBargain
      };

      if (editId) {
        await db.collection('products').doc(editId).update({ data: productData });
      } else {
        await db.collection('products').add({ data: { ...productData, wants: 0, createTime: db.serverDate() } });
        if (userInfo) {
          userInfo.published = (userInfo.published || 0) + 1;
          Taro.setStorageSync('userInfo', userInfo);
        }
      }

      Taro.hideLoading();
      Taro.showToast({ title: editId ? '修改成功' : '发布成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: '操作失败，请重试', icon: 'error' });
    }
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50 w-full box-border overflow-hidden">
      <ScrollView scrollY className="flex-1 px-4 pt-4 hide-scrollbar w-full box-border">

        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm w-full box-border">
          <View className="w-24 h-24 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden active:bg-zinc-100" onClick={handleUploadImage}>
            {imagePath ? (
              // 核心修复：在此 Image 上添加 mode="aspectFill"，强制不拉伸填满
              <Image src={imagePath} mode="aspectFill" className="w-full h-full object-cover" />
            ) : (
              <>
                <Image src={getIcon('camera', '#D4D4D8')} className="w-6 h-6 mb-1" />
                <Text className="text-[10px] text-zinc-400">添加照片</Text>
              </>
            )}
          </View>
        </View>

        <View className="bg-white rounded-2xl px-4 py-2 mb-4 shadow-sm w-full box-border">
          <Input value={title} placeholder="给宝贝起个吸引人的标题吧" className="text-lg font-bold py-4 border-b border-zinc-50 w-full box-border" placeholderStyle="color: #A1A1AA; font-weight: bold;" onInput={(e) => setTitle(e.detail.value)} />
          <Textarea value={desc} placeholder="描述一下宝贝的来源、成色、转手原因..." className="w-full h-40 py-4 text-base leading-relaxed box-border" placeholderStyle="color: #D4D4D8;" maxlength={500} onInput={(e) => setDesc(e.detail.value)} />
        </View>

        <View className="bg-white rounded-2xl px-4 mb-8 shadow-sm w-full box-border">
          <Picker mode="selector" range={categories} value={categoryIndex} onChange={(e) => setCategoryIndex(Number(e.detail.value))}>
            <View className="flex justify-between items-center py-4 border-b border-zinc-50">
              <View className="flex items-center"><Image src={getIcon('layers', '#3F3F46')} className="w-5 h-5 mr-3" /><Text className="text-base text-zinc-800">分类</Text></View>
              <View className="flex items-center"><Text className="text-sm text-blue-500 font-medium">{categories[categoryIndex]}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-4 h-4 ml-1" /></View>
            </View>
          </Picker>

          <Picker mode="selector" range={conditions} value={conditionIndex} onChange={(e) => setConditionIndex(Number(e.detail.value))}>
            <View className="flex justify-between items-center py-4 border-b border-zinc-50">
              <View className="flex items-center"><Image src={getIcon('sparkles', '#3F3F46')} className="w-5 h-5 mr-3" /><Text className="text-base text-zinc-800">成色</Text></View>
              <View className="flex items-center"><Text className="text-sm text-blue-500 font-medium">{conditions[conditionIndex]}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-4 h-4 ml-1" /></View>
            </View>
          </Picker>

          <View className="flex justify-between items-center py-4">
            <View className="flex items-center"><Image src={getIcon('dollar-sign', '#3F3F46')} className="w-5 h-5 mr-3" /><Text className="text-base text-zinc-800 font-bold">价格</Text></View>
            <View className="flex items-center">
              <Text className="text-red-500 font-bold mr-1">¥</Text>
              <Input type="digit" value={price} placeholder="0.00" className="w-24 text-right text-xl text-red-500 font-bold pr-1 box-border" placeholderStyle="color: #FECACA;" onInput={(e) => setPrice(e.detail.value)} />
            </View>
          </View>

          <View className="flex justify-between items-center py-4 border-t border-zinc-50">
            <View className="flex items-center">
              <Image src={getIcon('scissors', '#3F3F46')} className="w-5 h-5 mr-3" />
              <Text className="text-base text-zinc-800">支持小刀 (可议价)</Text>
            </View>
            <Switch color="#2563EB" checked={isBargain} onChange={(e) => setIsBargain(e.detail.value)} />
          </View>
        </View>
      </ScrollView>

      <View className="px-5 py-4 pb-8 bg-white border-t border-zinc-100 w-full box-border shrink-0 z-50">
        <Button className="w-full bg-blue-600 text-white rounded-full font-bold py-1 border-none active:opacity-90 shadow-lg shadow-blue-100" onClick={handleSubmit}>
          {editId ? '保存修改' : '发布宝贝'}
        </Button>
      </View>
    </View>
  );
}

# Kanji Wonderland

一个以日语汉字词、音读关系和图谱学习为核心的 Vue 3 + Vite 项目。

## 开发

安装依赖：

```bash
pnpm install
```

本地开发：

```bash
pnpm dev
```

生产构建：

```bash
pnpm build
```

本地预览构建结果：

```bash
pnpm preview
```

## 音读数据维护

音读数据放在：

```text
src/config/onyomi/rhymes/
```

每个韵母一个文件，例如：

```text
src/config/onyomi/rhymes/ang.ts
src/config/onyomi/rhymes/uang.ts
src/config/onyomi/rhymes/iang.ts
```

### 录入规则

- 每条数据代表一个 `拼音 + 汉字 + 音读` 对应关系。
- `japaneseWords` 里放例词，尽量写成 `汉字（假名）` 或 `词语（假名）` 的形式。
- 同一个拼音下如果多个汉字对应同一个音读，图谱会自动合并显示。
- 同一个汉字如果在资料里分属不同音读分支，可以拆成不同条目；`id` 保持唯一即可。
- 词例中的 `~` / `〜` 会在汇总时自动清理。

### 更新模式二音读面板顺序

模式二的音读面板顺序不是实时生成的，而是写死在：

```text
src/config/onyomi/onyomiOrder.ts
```

这个文件通过脚本自动生成，排序规则是：

- 按每个音读下的“唯一汉字条目数”从多到少排列
- 数量相同时按音读字面顺序排列

更新音读顺序：

```bash
pnpm update:onyomi-order
```

一键同步音读顺序并做构建校验：

```bash
pnpm sync:onyomi
```

建议流程：

1. 修改 `src/config/onyomi/rhymes/*.ts`
2. 运行 `pnpm sync:onyomi`
3. 确认页面显示正常

## 词库相关命令

校验词库：

```bash
pnpm validate:words
```

更新中心词池：

```bash
pnpm update:center-pool
```

一键同步词库：

```bash
pnpm sync:wordbank
```

## 关键文件

- `src/pages/OnyomiMapPage.vue`：音读关系图谱页面
- `src/components/OnyomiGraph.vue`：图谱渲染组件
- `src/config/onyomi/index.ts`：音读数据聚合入口
- `src/config/onyomi/rhymeOrder.ts`：韵母面板固定顺序
- `src/config/onyomi/onyomiOrder.ts`：模式二音读面板固定顺序
- `scripts/update-onyomi-order.mjs`：自动生成音读面板顺序

## 备注

- `src/assets/wechat-qr.jpeg` 是关于页使用的微信二维码图片。
- 当前导航里的“和语词根词源”入口已隐藏，后续可按付费权限开放。

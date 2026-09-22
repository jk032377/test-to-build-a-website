# 留白誌 MARGIN

以 Jekyll + GitHub Pages 製作的極簡雜誌型部落格。

## 新增文章

在 `_posts/` 新增 Markdown：

```yaml
---
layout: post
title: "文章標題"
description: "文章摘要"
category: 閱讀
tone: sand
cover_word: READ
---
```

檔名格式：`YYYY-MM-DD-your-slug.md`

可用色調：`sand`、`sage`、`blue`、`rose`。

## 自動功能

- 首頁自動抓最新文章
- 文章彙整依分類產生
- 文章頁顯示上一篇／下一篇
- 推薦閱讀優先抓同分類文章
- 響應式手機版
- 基本 SEO / Open Graph
- GitHub Pages 自動部署

網站名稱、描述與網址可在 `_config.yml` 修改。

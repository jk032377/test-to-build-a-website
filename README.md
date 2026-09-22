# 留白誌 MARGIN

以 Jekyll + GitHub Pages 製作的極簡雜誌型部落格。

## 目前功能

- 獨立雜誌感首頁
- 手繪線稿與低彩度插圖感裝飾
- Markdown 發文
- 自動文章彙整
- 文章底部推薦閱讀
- 上一篇／下一篇
- 閱讀進度條
- 手機版 RWD
- 站內搜尋
- sitemap.xml / robots.txt
- Google Analytics 預留
- Google AdSense 預留
- 隱私權政策頁

## 新增文章

到 `_posts/` 新增 Markdown。

檔名格式：

```text
YYYY-MM-DD-your-slug.md
```

Front Matter：

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

可用色調：`sand`、`sage`、`blue`、`rose`。

## Google Analytics

把 `_config.yml`：

```yaml
google_analytics_id: ""
```

改成你的 GA4 Measurement ID，例如：

```yaml
google_analytics_id: "G-XXXXXXXXXX"
```

## Google AdSense

把 `_config.yml`：

```yaml
google_adsense_id: ""
```

改成你的 AdSense client id，例如：

```yaml
google_adsense_id: "ca-pub-1234567890123456"
```

全站 AdSense script 已預留。若啟用 AdSense，也要依 AdSense 後台提供的正式內容新增根目錄 `ads.txt`；`ads.txt.example` 僅為格式提示，不應直接拿來上線。

## WordPress 搬站

詳見 `MIGRATION-WP-TO-GITHUB.md`。

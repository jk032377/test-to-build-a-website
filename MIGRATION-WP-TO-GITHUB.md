# WordPress 搬到 GitHub Pages：SEO 安全遷移清單

## 最低風險原則

最理想的遷移方式是：

- 原網域不變
- 原文章 URL 不變
- 原圖片 URL 儘量不變
- 只更換主機／網站產生方式

這樣搜尋引擎看到的是同一個網站換了基礎設施，而不是整站換網址。

## 圖片

WordPress 常見圖片網址：

```text
https://example.com/wp-content/uploads/2026/09/photo.jpg
```

可以在 GitHub repository 建立相同路徑：

```text
wp-content/uploads/2026/09/photo.jpg
```

搭配同一個自訂網域，圖片網址就可以維持不變。

## 文章 URL

如果 WordPress 原本是：

```text
https://example.com/my-article/
```

最好讓 Jekyll 最後仍輸出：

```text
https://example.com/my-article/
```

如果必須改 URL，建立完整 URL mapping，並在能控制 301/308 的層（例如 Cloudflare）做一對一永久重新導向。

## 上線前確認

- 所有文章標題、正文、圖片與 alt 文字完整
- title / description / canonical 正確
- HTTPS 正常
- robots.txt 可抓取
- sitemap.xml 正常
- Google Search Console 已驗證
- GA4 已切到新站
- 內部連結沒有指向舊網址
- 404 與失效連結已檢查

## 正式使用自訂網域

1. 在 GitHub Pages 設定自訂網域。
2. 把 `_config.yml` 的 `url` 改成正式網域。
3. 把 `baseurl` 改成空字串。
4. DNS 指向 GitHub Pages。
5. 開啟 Enforce HTTPS。
6. 全站檢查完成後再正式切換流量。

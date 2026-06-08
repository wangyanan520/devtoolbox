import type { GenericScrapingConfig, ScrapedArticle } from '@/types'

export function generateGenericScriptContent(
  config: GenericScrapingConfig,
  selectedArticles: ScrapedArticle[],
): string {
  const selectedUrls = JSON.stringify(selectedArticles.map(a => a.url))
  const extraHeaders = config.extraHeaders.trim() || '{}'

  return `# -*- coding: utf-8 -*-
# 通用网页批量下载脚本
# 依赖: pip install requests beautifulsoup4

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time
import urllib.parse

# ========== 配置区 ==========
ENTRY_URL = ${JSON.stringify(config.entryUrl)}
LINK_SELECTOR = ${JSON.stringify(config.linkSelector)}
TITLE_SELECTOR = ${JSON.stringify(config.titleSelector)}
CONTENT_SELECTOR = ${JSON.stringify(config.contentSelector)}
PAGINATION_SELECTOR = ${JSON.stringify(config.paginationSelector)}
COOKIE = ${JSON.stringify(config.cookie)}
OUTPUT_DIR = "./downloaded_content"
EXTRA_HEADERS = ${extraHeaders}

# 已选文章 URL 列表
SELECTED_URLS = ${selectedUrls}
# ============================

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})
if COOKIE:
    session.headers['Cookie'] = COOKIE
session.headers.update(EXTRA_HEADERS)


def log(msg):
    print(f"[Scraper] {msg}")


def download_file(url, filepath, retry=3):
    for i in range(retry):
        try:
            r = session.get(url, stream=True, timeout=30)
            if r.status_code == 200:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, 'wb') as f:
                    for chunk in r.iter_content(8192):
                        f.write(chunk)
                return True
        except:
            if i < retry - 1:
                time.sleep(2)
    return False


def resolve_url(base_url, href):
    """将相对 URL 解析为绝对 URL，考虑 <base> 标签"""
    if href.startswith('http://') or href.startswith('https://'):
        return href
    return urllib.parse.urljoin(base_url, href)


def download_images_and_replace(html_content, base_dir, page_url):
    """下载图片并替换 src 为本地路径"""
    img_dir = os.path.join(base_dir, "images")
    os.makedirs(img_dir, exist_ok=True)

    soup = BeautifulSoup(html_content, 'html.parser')
    base_tag = soup.find('base')
    base_url = base_tag.get('href', page_url) if base_tag else page_url

    for img in soup.find_all('img'):
        src = img.get('src')
        if not src:
            continue
        abs_url = resolve_url(base_url, src)
        if not abs_url.startswith('http'):
            continue
        parsed = urllib.parse.urlparse(abs_url)
        filename = os.path.basename(parsed.path)
        if not filename or '.' not in filename:
            filename = f"img_{hash(abs_url) & 0xFFFFFFFF}.png"
        local_path = os.path.join(img_dir, filename)
        if not os.path.exists(local_path):
            download_file(abs_url, local_path)
        img['src'] = f"images/{filename}"

    return str(soup)


def scrape_article(url, output_dir):
    log(f"下载文章: {url}")
    try:
        r = session.get(url, timeout=30)
        r.encoding = r.apparent_encoding
        if r.status_code != 200:
            log(f"  请求失败: HTTP {r.status_code}")
            return False
    except Exception as e:
        log(f"  请求异常: {e}")
        return False

    soup = BeautifulSoup(r.text, 'html.parser')

    title_el = soup.select_one(TITLE_SELECTOR) if TITLE_SELECTOR else None
    title = title_el.get_text(strip=True) if title_el else "untitled"
    safe_title = re.sub(r'[\\\\/*?:"<>|]', '', title).strip()
    if not safe_title:
        safe_title = f"article_{hash(url) & 0xFFFFFFFF}"

    content_el = soup.select_one(CONTENT_SELECTOR) if CONTENT_SELECTOR else soup.body
    if not content_el:
        log(f"  未找到正文内容 (选择器: {CONTENT_SELECTOR})")
        return False

    article_html = str(content_el)
    article_html = download_images_and_replace(article_html, output_dir, url)

    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
    {article_html}
</body>
</html>"""

    filepath = os.path.join(output_dir, f"{safe_title}.html")
    os.makedirs(output_dir, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(full_html)
    log(f"  已保存: {filepath}")
    return True


def scrape_listing(url, link_selector, pagination_selector=None):
    """扫描列表页，返回所有文章链接"""
    log(f"扫描列表页: {url}")
    try:
        r = session.get(url, timeout=30)
        r.encoding = r.apparent_encoding
        if r.status_code != 200:
            log(f"  请求失败: HTTP {r.status_code}")
            return [], None
    except Exception as e:
        log(f"  请求异常: {e}")
        return [], None

    soup = BeautifulSoup(r.text, 'html.parser')
    links = soup.select(link_selector)
    articles = []
    for a in links:
        href = a.get('href')
        text = a.get_text(strip=True)
        if href and text:
            full_url = resolve_url(url, href)
            articles.append({'url': full_url, 'title': text})

    next_url = None
    if pagination_selector:
        next_el = soup.select_one(pagination_selector)
        if next_el:
            next_href = next_el.get('href')
            if next_href:
                next_url = resolve_url(url, next_href)

    return articles, next_url


def collect_all_articles(start_url, link_selector, pagination_selector=None):
    """递归翻页，收集所有文章"""
    all_articles = []
    seen_urls = set()
    current_url = start_url

    while current_url:
        articles, next_url = scrape_listing(current_url, link_selector, pagination_selector)
        for a in articles:
            if a['url'] not in seen_urls:
                seen_urls.add(a['url'])
                all_articles.append(a)
        current_url = next_url

    return all_articles


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    log(f"输出目录: {OUTPUT_DIR}")
    log(f"已选文章: {len(SELECTED_URLS)} 篇")

    for i, article_url in enumerate(SELECTED_URLS, 1):
        log(f"[{i}/{len(SELECTED_URLS)}]")
        scrape_article(article_url, OUTPUT_DIR)

    log("全部下载完成！")


if __name__ == '__main__':
    main()
`
}

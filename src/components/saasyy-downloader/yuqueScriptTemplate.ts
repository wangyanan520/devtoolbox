export function generateYuqueScriptContent(
  entryUrl: string,
  outputDir: string,
): string {
  return `# -*- coding: utf-8 -*-
# 语雀知识库批量下载脚本
# 依赖安装: pip install playwright beautifulsoup4
# 浏览器安装: python -m playwright install chromium
# 使用方法: python yuque_downloader.py

import sys
import os
import re
import json
import time
import urllib.parse
from pathlib import Path

REQUIRED_PACKAGES = {
    'playwright': 'playwright',
    'bs4': 'beautifulsoup4',
}

missing = []
for import_name, pip_name in REQUIRED_PACKAGES.items():
    try:
        __import__(import_name)
    except ImportError:
        missing.append(pip_name)

if missing:
    print(f"[Yuque] 缺少依赖包: {', '.join(missing)}")
    print(f"[Yuque] 请运行: pip install {' '.join(missing)}")
    print(f"[Yuque] 然后运行: python -m playwright install chromium")
    sys.exit(1)

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

# ========== 配置区（由工具站自动生成）==========
ENTRY_URL = ${JSON.stringify(entryUrl)}
OUTPUT_DIR = ${JSON.stringify(outputDir)}
# ==============================================

def log(msg):
    print(f"[Yuque] {msg}")


def extract_appdata(page):
    """从页面中提取 window.appData 的 JSON 数据"""
    app_data = page.evaluate("""() => {
        try {
            return JSON.parse(decodeURIComponent(
                document.querySelector('script').innerText
                    .match(/decodeURIComponent\\\\(["\\'"])(.+?)\\\\1/)[2]
            ));
        } catch(e) {
            return null;
        }
    }""")
    if app_data:
        return app_data
    # Fallback: search all scripts
    return page.evaluate("""() => {
        const scripts = document.querySelectorAll('script');
        for (const s of scripts) {
            const match = s.textContent && s.textContent.match(/window\\.appData\\s*=\\s*JSON\\.parse\\(decodeURIComponent\\\\(["\\'"])(.+?)\\1\\)/);
            if (match) {
                try {
                    return JSON.parse(decodeURIComponent(match[2]));
                } catch(e) {}
            }
        }
        return null;
    }""")


def build_tree_from_toc(toc_items):
    """将 TOC 数组转换为树形结构"""
    root_items = []
    uuid_map = {}

    for item in toc_items:
        uuid = item.get('uuid', '')
        uuid_map[uuid] = {
            'title': item.get('title', ''),
            'url': item.get('url', ''),
            'type': item.get('type', 'DOC'),
            'doc_id': item.get('doc_id', ''),
            'uuid': uuid,
            'parent_uuid': item.get('parent_uuid', ''),
            'children': [],
        }

    for item in toc_items:
        uuid = item.get('uuid', '')
        parent_uuid = item.get('parent_uuid', '')
        node = uuid_map[uuid]
        if parent_uuid and parent_uuid in uuid_map:
            uuid_map[parent_uuid]['children'].append(node)
        else:
            root_items.append(node)

    return root_items


def get_article_content(page, url):
    """获取文章正文内容"""
    log(f"加载文章: {url}")
    try:
        page.goto(url, wait_until='networkidle', timeout=60000)
        time.sleep(2)
    except Exception as e:
        log(f"  页面加载超时: {e}")
        return None, None

    # Try to get rendered content via evaluate
    content_html = page.evaluate("""() => {
        // Try multiple selectors to find the article content
        const selectors = [
            '.ne-render-content',
            '.lake-content-editor',
            '.article-content',
            '.doc-content',
            '[class*="content"]',
            'article',
            '.ne-viewer',
            '.layout-content',
            '.doc-container',
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 50) {
                return el.innerHTML;
            }
        }
        // Fallback: get the main content area
        const main = document.querySelector('main') || document.querySelector('.main-content');
        if (main) return main.innerHTML;

        // Last resort: get #app content (might include navigation)
        const app = document.querySelector('#app') || document.querySelector('#__next');
        if (app) return app.innerHTML;

        return document.body.innerHTML;
    }""")

    # Try to get title
    title = page.evaluate("""() => {
        const titleEl = document.querySelector('h1') ||
            document.querySelector('.doc-title') ||
            document.querySelector('[class*="title"]') ||
            document.querySelector('title');
        return titleEl ? titleEl.innerText || titleEl.textContent : '无标题';
    }""")

    if not content_html or len(content_html) < 100:
        log(f"  ⚠ 未找到文章内容，页面可能不包含有效内容")
        return None, title

    return content_html, title


def save_article(content_html, title, output_path, base_url):
    """保存文章 HTML 并处理图片"""
    safe_title = re.sub(r'[\\\\/*?:"<>|]', '', title).strip()
    if not safe_title:
        safe_title = f"article_{int(time.time())}"
    filename = f"{safe_title}.html"

    soup = BeautifulSoup(content_html, 'html.parser')

    # Download images
    img_dir = os.path.join(os.path.dirname(output_path), 'images')
    os.makedirs(img_dir, exist_ok=True)

    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src') or ''
        if not src:
            continue
        if src.startswith('data:'):
            continue

        # Make absolute URL
        if src.startswith('//'):
            src = 'https:' + src
        elif src.startswith('/'):
            src = urllib.parse.urljoin(base_url, src)
        elif not src.startswith('http'):
            src = urllib.parse.urljoin(base_url, src)

        # Download image
        try:
            from playwright.sync_api import sync_playwright as _sp
            img_response = page_context.get('browser') or None
        except:
            img_response = None

        img_filename = os.path.basename(urllib.parse.urlparse(src).path)
        if not img_filename or '.' not in img_filename:
            img_filename = f"img_{hash(src) & 0x7FFFFFFF}.png"

        local_path = os.path.join(img_dir, img_filename)
        if not os.path.exists(local_path):
            try:
                import requests
                r = requests.get(src, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': base_url,
                }, timeout=30)
                if r.status_code == 200:
                    with open(local_path, 'wb') as f:
                        f.write(r.content)
                    log(f"    图片下载成功: {img_filename}")
                else:
                    log(f"    图片下载失败: HTTP {r.status_code}")
                    continue
            except Exception as e:
                log(f"    图片下载异常: {e}")
                continue

        img['src'] = f"images/{img_filename}"

    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }}
        img {{ max-width: 100%; height: auto; }}
        h1 {{ font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 10px; }}
        pre {{ background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    {str(soup)}
</body>
</html>"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    filepath = os.path.join(output_path, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(full_html)
    log(f"  已保存: {filepath}")
    return filepath


page_context = {}


def crawl_node(node, parent_path, browser, base_url, selected_urls=None):
    """递归爬取目录节点"""
    title = node['title']
    safe_title = re.sub(r'[\\\\/*?:"<>|]', '', title).strip() or 'untitled'
    current_path = os.path.join(parent_path, safe_title)

    if node['type'] in ('TITLE',) or (node['type'] == 'DOC' and node['children']):
        # 目录节点：创建文件夹，遍历子节点
        os.makedirs(os.path.join(OUTPUT_DIR, current_path), exist_ok=True)
        for child in node.get('children', []):
            crawl_node(child, current_path, browser, base_url, selected_urls)
        return

    if node['type'] == 'DOC' and not node.get('children'):
        # 文章节点
        url_slug = node.get('url', '')
        if not url_slug:
            return

        # 获取 user/repo slug
        url_parts = urllib.parse.urlparse(ENTRY_URL)
        path_parts = url_parts.path.strip('/').split('/')
        if len(path_parts) >= 2:
            user_slug = path_parts[0]
            repo_slug = path_parts[1]
        else:
            user_slug = ''
            repo_slug = ''

        article_url = f"https://www.yuque.com/{user_slug}/{repo_slug}/{url_slug}"

        if selected_urls is not None and article_url not in selected_urls:
            return

        page = browser.new_page()
        try:
            content_html, article_title = get_article_content(page, article_url)
            if content_html and article_title:
                save_article(content_html, article_title, os.path.join(OUTPUT_DIR, parent_path), article_url)
            else:
                log(f"  跳过无内容页面: {article_url}")
        except Exception as e:
            log(f"  ❌ 下载失败: {article_url} - {e}")
        finally:
            page.close()


def main():
    log(f"入口 URL: {ENTRY_URL}")
    log(f"输出目录: {OUTPUT_DIR}")
    log("")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        )
        page = context.new_page()

        global page_context
        page_context['browser'] = browser

        try:
            # Step 1: Load the entry page and extract TOC
            log("正在加载入口页面...")
            page.goto(ENTRY_URL, wait_until='networkidle', timeout=60000)
            time.sleep(3)

            app_data = extract_appdata(page)
            if not app_data:
                log("❌ 无法从页面提取 appData，请确认 URL 是否正确")
                browser.close()
                return

            book_data = app_data.get('book', {})
            toc_items = book_data.get('toc', [])

            if not toc_items:
                log("❌ 未找到目录数据 (toc)")
                browser.close()
                return

            log(f"✓ 已获取目录数据，共 {len(toc_items)} 个条目")
            log(f"  知识库名称: {book_data.get('name', '未知')}")
            log("")

            # Step 2: Build tree structure
            tree = build_tree_from_toc(toc_items)
            doc_count = sum(1 for item in toc_items if item.get('type') == 'DOC')
            log(f"  共 {doc_count} 篇文章")
            log("")

            # Step 3: Crawl and download
            log("开始下载文章...")
            log("")

            # Collect all DOC URLs for deduplication
            url_parts = urllib.parse.urlparse(ENTRY_URL)
            path_parts = url_parts.path.strip('/').split('/')
            user_slug = path_parts[0] if len(path_parts) >= 2 else ''
            repo_slug = path_parts[1] if len(path_parts) >= 2 else ''

            downloaded = 0
            for root_node in tree:
                crawl_node(root_node, '', browser)

            log("")
            log("✓ 全部下载完成！")
            log(f"  文章保存到: {os.path.abspath(OUTPUT_DIR)}")

        except Exception as e:
            log(f"❌ 运行异常: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()


if __name__ == '__main__':
    main()
`;
}

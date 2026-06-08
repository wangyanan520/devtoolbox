export function generateScriptContent(
  cookie: string,
  accessProfile: string,
  catalogJson: string,
  selectedIds: number[],
  generatePdf: boolean,
): string {
  return `# -*- coding: utf-8 -*-
# SaaSSY 学习资料批量下载脚本
# 自动生成，请勿手动修改配置区内容

import argparse
import requests
import json
import os
import re
import time
import urllib.parse
import subprocess
import pathlib
import tempfile
import shutil
import sys

# ========== 配置区 ==========
COOKIE = ${JSON.stringify(cookie)}
ACCESSPROFILE = ${JSON.stringify(accessProfile)}
OUTPUT_DIR = "./SaaSSY\u6559\u7a0b"
GENERATE_PDF = ${generatePdf ? 'True' : 'False'}
EXTRA_HEADERS = {}

CATALOG_JSON = """${catalogJson}"""

SELECTED_IDS = set(${JSON.stringify(selectedIds)})
# ============================

session = requests.Session()
session.headers.update({
    'Cookie': COOKIE,
    'accessprofile': ACCESSPROFILE,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
})
session.headers.update(EXTRA_HEADERS)

HANDLER_URL = "https://demo.saasyy.com/Handler/SysSettingHandler.ashx"

def log(msg):
    print(f"[SaaSSY] {msg}")

def download_file(url, filepath, retry=3):
    for i in range(retry):
        try:
            r = session.get(url, stream=True, timeout=30)
            if r.status_code == 200:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                return True
            else:
                log(f"\u7b2c{i+1}\u6b21\u4e0b\u8f7d\u5931\u8d25: HTTP {r.status_code}")
        except Exception as e:
            log(f"\u7b2c{i+1}\u6b21\u4e0b\u8f7d\u5f02\u5e38: {e}")
        time.sleep(1)
    return False

def download_video(video_url, filepath):
    log(f"\u4e0b\u8f7d\u89c6\u9891: {os.path.basename(filepath)}")
    if download_file(video_url, filepath):
        log(f"  \u6210\u529f -> {filepath}")
        return True
    else:
        log(f"  \u5931\u8d25: {video_url}")
    return False

def download_article(article_id, html_filepath):
    log(f"\u4e0b\u8f7d\u56fe\u6587: id={article_id}")
    payload = f"visit=getmanualdatadetail&id={article_id}"
    for i in range(3):
        try:
            r = session.post(HANDLER_URL, data=payload, timeout=30)
            if r.status_code == 200:
                data = r.json()
                if data.get('status') and 'content' in data:
                    html_content = data['content']
                    html_content = download_images_and_replace(html_content, os.path.dirname(html_filepath))
                    os.makedirs(os.path.dirname(html_filepath), exist_ok=True)
                    with open(html_filepath, 'w', encoding='utf-8') as f:
                        f.write(html_content)
                    log(f"  HTML -> {html_filepath}")
                    return True
        except Exception as e:
            log(f"  \u7b2c{i+1}\u6b21\u8bf7\u6c42\u5f02\u5e38: {e}")
        time.sleep(1)
    log(f"  \u5931\u8d25: id={article_id}")
    return False

def download_images_and_replace(html_content, base_dir):
    img_dir = os.path.join(base_dir, "images")
    os.makedirs(img_dir, exist_ok=True)

    def replace_img_src(match):
        tag = match.group(0)
        src_match = re.search("src=['\\"]([^'\\"]+)['\\"]", tag)
        if not src_match:
            return tag

        original_url = src_match.group(1)
        if not original_url.startswith('http'):
            return tag

        parsed = urllib.parse.urlparse(original_url)
        filename = os.path.basename(parsed.path)
        if not filename or '.' not in filename:
            filename = f"img_{hash(original_url) & 0xFFFFFFFF}.png"

        local_path = os.path.join(img_dir, filename)

        if os.path.exists(local_path):
            local_src = f"images/{filename}"
            new_tag = tag.replace(f'src="{original_url}"', f'src="{local_src}"')
            new_tag = new_tag.replace(f"src='{original_url}'", f"src='{local_src}'")
            return new_tag

        try:
            r = session.get(original_url, stream=True, timeout=30)
            if r.status_code == 200:
                with open(local_path, 'wb') as f:
                    for chunk in r.iter_content(8192):
                        if chunk:
                            f.write(chunk)
                local_src = f"images/{filename}"
                new_tag = tag.replace(f'src="{original_url}"', f'src="{local_src}"')
                new_tag = new_tag.replace(f"src='{original_url}'", f"src='{local_src}'")
                return new_tag
        except:
            pass
        return tag

    html_content = re.sub(r'<img[^>]+>', replace_img_src, html_content)
    return html_content

def should_download(node):
    node_id = node.get('id')
    if not node_id:
        return False, []
    content_type = node.get('contentType')
    if content_type == 1 or content_type == 2:
        in_selected = node_id in SELECTED_IDS
        return in_selected, [node_id] if in_selected else []
    child_ids = []
    for child in node.get('children', []):
        should, ids = should_download(child)
        child_ids.extend(ids)
    return len(child_ids) > 0, child_ids

def process_node(node, parent_path="", counter=0):
    title = node['title']
    safe_title = re.sub(r'[\\\\/*?:"<>|]', '', title).strip()
    if not safe_title:
        safe_title = f"untitled_{node.get('id', 0)}"
    prefix = f"{counter:02d}-" if counter > 0 else ""
    numbered_title = f"{prefix}{safe_title}"
    current_path = os.path.join(parent_path, numbered_title) if parent_path else numbered_title

    content_type = node.get('contentType')
    children = node.get('children', [])

    if content_type == 0 or children:
        has_content, _ = should_download(node)
        if not has_content:
            return
        dir_path = os.path.join(OUTPUT_DIR, current_path)
        os.makedirs(dir_path, exist_ok=True)
        for i, child in enumerate(children, 1):
            process_node(child, current_path, i)
        return

    node_id = node.get('id')
    if not node_id:
        return

    if content_type == 1 and node_id in SELECTED_IDS:
        filepath = os.path.join(OUTPUT_DIR, current_path + ".html")
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        download_article(node_id, filepath)

    elif content_type == 2 and node_id in SELECTED_IDS:
        video_url = node.get('videoPath')
        if video_url:
            filepath = os.path.join(OUTPUT_DIR, current_path + ".mp4")
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            download_video(video_url, filepath)

# ========== PDF 合成模块 ==========

def find_browser():
    candidates = [
        os.path.expandvars(r"%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe"),
        r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\\Microsoft\\Edge\\Application\\msedge.exe"),
        r"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        r"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None

def html_to_pdf(html_path, pdf_path, browser):
    html_uri = pathlib.Path(html_path).absolute().as_uri()
    result = subprocess.run([
        browser, '--headless', '--disable-gpu',
        f'--print-to-pdf={pdf_path}',
        html_uri
    ], capture_output=True, timeout=60)
    return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0

def get_chapter_title(filepath, base_dir):
    rel_path = os.path.relpath(filepath, base_dir)
    parts = rel_path.replace('\\\\', '/').split('/')
    chapter = ''
    section = ''
    for i, part in enumerate(parts):
        clean = re.sub(r'^\\d{2}-', '', part)
        clean = clean.replace('.html', '').replace('.mp4', '')
        if i < len(parts) - 1:
            chapter = clean
        else:
            section = clean
    if chapter:
        return f"{chapter} - {section}"
    return section

def scan_directory(base_dir):
    html_files = []
    mp4_files = []
    for root, dirs, files in os.walk(base_dir):
        dirs.sort()
        files.sort()
        for f in files:
            fpath = os.path.join(root, f)
            if f.lower().endswith('.html'):
                html_files.append(fpath)
            elif f.lower().endswith('.mp4'):
                mp4_files.append(fpath)
    return html_files, mp4_files

def create_video_placeholder_page(video_path, output_html):
    video_name = os.path.basename(video_path)
    rel_name = re.sub(r'^\\d{2}-', '', video_name).replace('.mp4', '')
    html_content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body {{ font-family: 'Microsoft YaHei', 'Inter', sans-serif; padding: 40px; text-align: center; }}
.video-placeholder {{ margin: 60px auto; max-width: 500px; }}
.icon {{ font-size: 64px; margin-bottom: 20px; }}
h2 {{ color: #333; margin-bottom: 10px; }}
p {{ color: #666; font-size: 14px; line-height: 1.8; }}
.note {{ margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #888; }}
</style></head><body>
<div class="video-placeholder">
<div class="icon">🎬</div>
<h2>{rel_name}</h2>
<p>\\u6B64\\u89C6\\u9891\\u5DF2\\u4F5C\\u4E3A\\u9644\\u4EF6\\u5D4C\\u5165 PDF</p>
<p>\\u8BF7\\u4F7F\\u7528 Adobe Acrobat \\u6216\\u5176\\u4ED6 PDF \\u9605\\u8BFB\\u5668\\u67E5\\u770B\\u9644\\u4EF6</p>
<div class="note">\\u6587\\u4EF6\\u540D: {video_name}</div>
</div>
</body></html>"""
    with open(output_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

def create_toc_page(html_files, mp4_files, base_dir, output_html):
    lines = ['<!DOCTYPE html>',
    '<html><head><meta charset="utf-8"><style>',
    'body { font-family: "Microsoft YaHei", "Inter", sans-serif; padding: 40px; }',
    'h1 { color: #2563eb; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }',
    '.toc-item { padding: 6px 0; font-size: 14px; color: #333; }',
    '.toc-item .num { color: #2563eb; font-weight: 600; margin-right: 8px; }',
    '.toc-item.video { color: #dc2626; }',
    '.toc-item .type { font-size: 12px; color: #999; margin-left: 8px; }',
    '.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; }',
    '</style></head><body>',
    '<h1>SaaSSY \\u5B66\\u4E60\\u6559\\u7A0B</h1>',
    '<p style="color: #666; font-size: 13px;">\\u5171 ' + str(len(html_files)) + ' \\u7BC7\\u56FE\\u6587\\u6559\\u7A0B</p>']

    current_chapter = ''
    for i, f in enumerate(html_files, 1):
        title = get_chapter_title(f, base_dir)
        lines.append(f'<div class="toc-item"><span class="num">{i}.</span>{title}</div>')

    if mp4_files:
        lines.append('<h2 style="margin-top: 30px; font-size: 18px; color: #dc2626;">\\u89C6\\u9891\\u9644\\u4EF6</h2>')
        for f in mp4_files:
            vname = os.path.basename(f)
            clean = re.sub(r'^\\d{2}-', '', vname).replace('.mp4', '')
            lines.append(f'<div class="toc-item video"><span class="num">🎬</span>{clean}<span class="type">.mp4</span></div>')

    lines.append('<div class="footer">\\u7531 SaaSSY \\u4E0B\\u8F7D\\u5668 \\u81EA\\u52A8\\u751F\\u6210</div>')
    lines.append('</body></html>')

    with open(output_html, 'w', encoding='utf-8') as f:
        f.write('\\n'.join(lines))

def merge_pdfs(pdf_pages, output_path):
    try:
        from pypdf import PdfWriter, PdfReader
    except ImportError:
        log("PDF \\u5408\\u5E76\\u5931\\u8D25: \\u8BF7\\u5148\\u5B89\\u88C5 pypdf: pip install pypdf")
        return False

    writer = PdfWriter()
    metadata = {
        '/Title': 'SaaSSY \\u5B66\\u4E60\\u6559\\u7A0B',
        '/Author': 'SaaSSY \\u4E0B\\u8F7D\\u5668',
        '/Subject': 'SaaSSY \\u5B66\\u4E60\\u8D44\\u6599\\u6C47\\u7F16',
    }
    writer.add_metadata(metadata)

    for pdf_path in pdf_pages:
        if os.path.exists(pdf_path):
            try:
                reader = PdfReader(pdf_path)
                for page in reader.pages:
                    writer.add_page(page)
            except Exception as e:
                log(f"  \\u8DF3\\u8FC7\\u65E0\\u6548 PDF: {os.path.basename(pdf_path)} - {e}")

    with open(output_path, 'wb') as f:
        writer.write(f)
    log(f"  \\u5408\\u5E76\\u5B8C\\u6210: {os.path.getsize(output_path):,} \\u5B57\\u8282")
    return True

def embed_videos(pdf_path, mp4_files):
    try:
        from pypdf import PdfWriter, PdfReader
    except ImportError:
        log("\\u8B66\\u544A: \\u65E0\\u6CD5\\u5D4C\\u5165\\u89C6\\u9891\\uff0c\\u8BF7\\u5B89\\u88C5 pypdf")
        return

    if not mp4_files:
        return

    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    for mp4 in mp4_files:
        vname = os.path.basename(mp4)
        try:
            with open(mp4, 'rb') as f:
                writer.add_attachment(vname, f.read())
            log(f"  \\u5D4C\\u5165\\u89C6\\u9891: {vname}")
        except Exception as e:
            log(f"  \\u89C6\\u9891\\u5D4C\\u5165\\u5931\\u8D25: {vname} - {e}")

    with open(pdf_path, 'wb') as f:
        writer.write(f)

def convert_and_merge():
    log("\\n=== \\u5F00\\u59CB\\u5408\\u6210 PDF ===")

    browser = find_browser()
    if not browser:
        log("\\u9519\\u8BEF: \\u672A\\u627E\\u5230 Chrome \\u6216 Edge \\u6D4F\\u89C8\\u5668\\uff0c\\u65E0\\u6CD5\\u751F\\u6210 PDF")
        log("  \\u4EC5\\u4FDD\\u5B58\\u4E86 HTML \\u6587\\u4EF6\\uFF0C\\u8BF7\\u786E\\u4FDD\\u5DF2\\u5B89\\u88C5 Chrome \\u6216 Edge")
        return

    log(f"\\u4F7F\\u7528\\u6D4F\\u89C8\\u5668: {os.path.basename(browser)}")

    html_files, mp4_files = scan_directory(OUTPUT_DIR)
    log(f"\\u627E\\u5230 {len(html_files)} \\u4E2A HTML \\u6587\\u4EF6, {len(mp4_files)} \\u4E2A MP4 \\u6587\\u4EF6")

    if not html_files:
        log("\\u6CA1\\u6709\\u53EF\\u8F6C\\u6362\\u7684 HTML \\u6587\\u4EF6")
        return

    pdf_output = OUTPUT_DIR.rstrip('\\\\/') + ".pdf"
    tmp_dir = tempfile.mkdtemp(prefix='saasyy_pdf_')
    pdf_pages = []

    try:
        toc_html = os.path.join(tmp_dir, '00_toc.html')
        toc_pdf = os.path.join(tmp_dir, '00_toc.pdf')
        create_toc_page(html_files, mp4_files, OUTPUT_DIR, toc_html)
        if html_to_pdf(toc_html, toc_pdf, browser):
            pdf_pages.append(toc_pdf)
            log("  \\u76EE\\u5F55\\u9875 -> OK")
        else:
            log("  \\u76EE\\u5F55\\u9875 -> \\u5931\\u8D25")

        for i, html_f in enumerate(html_files, 1):
            rel = os.path.relpath(html_f, OUTPUT_DIR)
            log(f"  [{i}/{len(html_files)}] \\u8F6C\\u6362: {rel}")
            tmp_pdf = os.path.join(tmp_dir, f"page_{i:04d}.pdf")
            if html_to_pdf(html_f, tmp_pdf, browser):
                pdf_pages.append(tmp_pdf)
            else:
                log(f"    \\u5931\\u8D25")

        for mp4_f in mp4_files:
            vname = os.path.basename(mp4_f)
            log(f"  \\u5904\\u7406\\u89C6\\u9891: {vname}")
            ph_html = os.path.join(tmp_dir, f"video_{vname}.html")
            ph_pdf = os.path.join(tmp_dir, f"video_{vname}.pdf")
            create_video_placeholder_page(mp4_f, ph_html)
            if html_to_pdf(ph_html, ph_pdf, browser):
                pdf_pages.append(ph_pdf)

        log("\\u5408\\u5E76 PDF...")
        if merge_pdfs(pdf_pages, pdf_output):
            log("\\u5D4C\\u5165\\u89C6\\u9891...")
            embed_videos(pdf_output, mp4_files)
            log(f"\\n\\u5B8C\\u6210! PDF \\u6587\\u4EF6: {pdf_output}")
        else:
            log("PDF \\u5408\\u5E76\\u5931\\u8D25")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

def do_download():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    log(f"\\u5F00\\u59CB\\u4E0B\\u8F7D\\uff0c\\u7F13\\u5B58\\u76EE\\u5F55: {OUTPUT_DIR}")
    log(f"\\u5DF2\\u9009\\u4E2D {len(SELECTED_IDS)} \\u4E2A\\u6587\\u4EF6")

    data = json.loads(CATALOG_JSON)
    catalog_list = data.get('list', []) if isinstance(data, dict) else data

    for i, top_node in enumerate(catalog_list, 1):
        process_node(top_node, "", i)

def has_existing_files():
    if not os.path.isdir(OUTPUT_DIR):
        return False
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f.lower().endswith('.html'):
                return True
    return False

def choose_mode(args_mode):
    if args_mode:
        return args_mode

    has_html = has_existing_files()

    if not has_html:
        return 'all' if GENERATE_PDF else 'download'

    print()
    print("=" * 50)
    print("  SaaSSY \\u4E0B\\u8F7D\\u5668 - \\u6A21\\u5F0F\\u9009\\u62E9")
    print("=" * 50)
    print(f"  \\u68C0\\u6D4B\\u5230 {OUTPUT_DIR} \\u4E2D\\u5DF2\\u6709 HTML \\u6587\\u4EF6")
    print()
    print("  1) \\u5B8C\\u6574\\u6D41\\u7A0B\\uFF08\\u91CD\\u65B0\\u4E0B\\u8F7D + \\u5408\\u6210 PDF\\uFF09")
    print("  2) \\u4EC5\\u5408\\u6210 PDF\\uFF08\\u8DF3\\u8FC7\\u4E0B\\u8F7D\\uFF0C\\u4F7F\\u7528\\u5DF2\\u6709 HTML\\uFF09")
    print("  3) \\u4EC5\\u4E0B\\u8F7D\\uFF08\\u8DF3\\u8FC7 PDF \\u5408\\u6210\\uFF09")
    print()
    print("  \\u4E5F\\u53EF\\u4EE5\\u76F4\\u63A5\\u4F20\\u53C2\\u8DF3\\u8FC7\\u9009\\u62E9:")
    print("     python download_saasyy.py --mode all      # \\u5B8C\\u6574\\u6D41\\u7A0B")
    print("     python download_saasyy.py --mode pdf      # \\u4EC5\\u5408\\u6210 PDF")
    print("     python download_saasyy.py --mode download # \\u4EC5\\u4E0B\\u8F7D")
    print("=" * 50)

    while True:
        choice = input("\\u8BF7\\u9009\\u62E9 (1/2/3): ").strip()
        if choice == '1':
            return 'all'
        elif choice == '2':
            return 'pdf'
        elif choice == '3':
            return 'download'
        else:
            print("\\u8F93\\u5165\\u65E0\\u6548\\uFF0C\\u8BF7\\u8F93\\u5165 1\\u30012 \\u6216 3")

def main():
    parser = argparse.ArgumentParser(description='SaaSSY \\u5B66\\u4E60\\u8D44\\u6599\\u6279\\u91CF\\u4E0B\\u8F7D\\u4E0E PDF \\u5408\\u6210\\u5DE5\\u5177')
    parser.add_argument('--mode', choices=['download', 'pdf', 'all'],
        help='\\u8FD0\\u884C\\u6A21\\u5F0F: download=\\u4EC5\\u4E0B\\u8F7D, pdf=\\u4EC5\\u5408\\u6210PDF, all=\\u4E0B\\u8F7D+PDF')
    parser.add_argument('--yes', action='store_true',
        help='\\u8DF3\\u8FC7\\u786E\\u8BA4\\u63D0\\u793A')
    args = parser.parse_args()

    mode = choose_mode(args.mode)

    if mode == 'download':
        if GENERATE_PDF:
            log("PDF \\u5408\\u6210\\u5DF2\\u5173\\u95ED\\uFF08\\u4EC5\\u4E0B\\u8F7D\\u6A21\\u5F0F\\uFF09")
        do_download()
        log("\\n\\u4E0B\\u8F7D\\u5B8C\\u6210\\uFF01")

    elif mode == 'pdf':
        if not GENERATE_PDF:
            log("PDF \\u5408\\u6210\\u672A\\u542F\\u7528\\uFF0C\\u8BF7\\u5728\\u914D\\u7F6E\\u533A\\u5C06 GENERATE_PDF \\u8BBE\\u4E3A True")
            sys.exit(1)
        log("\\u8DF3\\u8FC7\\u4E0B\\u8F7D\\uFF0C\\u76F4\\u63A5\\u5408\\u6210 PDF")
        log(f"\\u4F7F\\u7528\\u76EE\\u5F55: {OUTPUT_DIR}")
        if not has_existing_files():
            log("\\u9519\\u8BEF: \\u76EE\\u5F55\\u4E2D\\u672A\\u627E\\u5230 HTML \\u6587\\u4EF6")
            sys.exit(1)
        browser = find_browser()
        if browser:
            log(f"\\u4F7F\\u7528\\u6D4F\\u89C8\\u5668: {os.path.basename(browser)}")
        try:
            convert_and_merge()
        except Exception as e:
            log(f"PDF \\u5408\\u6210\\u5F02\\u5E38: {e}")
            sys.exit(1)

    elif mode == 'all':
        if GENERATE_PDF:
            browser = find_browser()
            if browser:
                log(f"PDF \\u5408\\u6210\\u5DF2\\u542F\\u7528\\uFF08\\u4F7F\\u7528 {os.path.basename(browser)} \\u65E0\\u5934\\u6A21\\u5F0F\\uFF09")
            else:
                log("\\u8B66\\u544A: \\u672A\\u627E\\u5230 Chrome/Edge\\uFF0C\\u4EC5\\u4FDD\\u5B58 HTML")
        else:
            log("PDF \\u5408\\u6210\\u5DF2\\u5173\\u95ED\\uFF0C\\u4EC5\\u4E0B\\u8F7D HTML \\u6587\\u4EF6")

        do_download()
        log("\\n\\u4E0B\\u8F7D\\u5B8C\\u6210\\uFF01")

        if GENERATE_PDF:
            try:
                convert_and_merge()
            except Exception as e:
                log(f"PDF \\u5408\\u6210\\u5F02\\u5E38: {e}")
                sys.exit(1)

    log("\\n\\u5168\\u90E8\\u5B8C\\u6210\\uFF01")

if __name__ == '__main__':
    main()
`
}

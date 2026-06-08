export function generatePdfConverterScript(): string {
  return `# -*- coding: utf-8 -*-
"""
SaaSSY 教程 PDF 合成工具
将下载好的 SaaSSY 教程目录合并为一个 PDF 文件

用法:
  python convert_to_pdf.py <教程目录> [输出文件名]

示例:
  python convert_to_pdf.py ./SaaSSY\u6559\u7a0b
  python convert_to_pdf.py ./SaaSSY\u6559\u7a0b ./\u5168\u90e8\u6559\u7a0b.pdf

依赖:
  pip install pypdf
"""

import os
import sys
import subprocess
import pathlib
import re
import tempfile
import shutil
import argparse

def log(msg):
    print(f"[PDF] {msg}")

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

def html_to_pdf(html_path, output_pdf, browser):
    html_uri = pathlib.Path(html_path).absolute().as_uri()
    result = subprocess.run([
        browser, '--headless', '--disable-gpu',
        f'--print-to-pdf={output_pdf}',
        html_uri
    ], capture_output=True, timeout=60)
    return os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 0

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
<div class="icon">\\uD83C\\uDFAC</div>
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
            lines.append(f'<div class="toc-item video"><span class="num">\\uD83C\\uDFAC</span>{clean}<span class="type">.mp4</span></div>')

    lines.append('<div class="footer">\\u753± SaaSSY \\u4E0B\\u8F7D\\u5668 \\u81EA\\u52A8\\u751F\\u6210</div>')
    lines.append('</body></html>')

    with open(output_html, 'w', encoding='utf-8') as f:
        f.write('\\n'.join(lines))

def merge_pdfs(pdf_pages, output_path):
    try:
        from pypdf import PdfWriter, PdfReader
    except ImportError:
        log("\\u9519\\u8BEF: \\u8BF7\\u5148\\u5B89\\u88C5 pypdf: pip install pypdf")
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
        return pdf_path

    if not mp4_files:
        return pdf_path

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
    return pdf_path

def main():
    parser = argparse.ArgumentParser(description='SaaSSY \\u6559\\u7A0B PDF \\u5408\\u6210\\u5DE5\\u5177')
    parser.add_argument('input_dir', help='\\u6559\\u7A0B\\u76EE\\u5F55\\u8DEF\\u5F84')
    parser.add_argument('output', nargs='?', default=None, help='\\u8F93\\u51FA PDF \\u6587\\u4EF6\\u540D')
    args = parser.parse_args()

    base_dir = os.path.abspath(args.input_dir)
    if not os.path.isdir(base_dir):
        log(f"\\u9519\\u8BEF: \\u76EE\\u5F55\\u4E0D\\u5B58\\u5728: {base_dir}")
        sys.exit(1)

    if args.output:
        output_pdf = os.path.abspath(args.output)
    else:
        dir_name = os.path.basename(base_dir)
        output_pdf = os.path.join(os.path.dirname(base_dir), f"{dir_name}.pdf")

    log(f"\\u8F93\\u5165\\u76EE\\u5F55: {base_dir}")
    log(f"\\u8F93\\u51FA\\u6587\\u4EF6: {output_pdf}")

    browser = find_browser()
    if not browser:
        log("\\u9519\\u8BEF: \\u672A\\u627E\\u5230 Chrome \\u6216 Edge \\u6D4F\\u89C8\\u5668")
        sys.exit(1)
    log(f"\\u4F7F\\u7528\\u6D4F\\u89C8\\u5668: {os.path.basename(browser)}")

    html_files, mp4_files = scan_directory(base_dir)
    log(f"\\u627E\\u5230 {len(html_files)} \\u4E2A HTML \\u6587\\u4EF6, {len(mp4_files)} \\u4E2A MP4 \\u6587\\u4EF6")

    if not html_files:
        log("\\u9519\\u8BEF: \\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 HTML \\u6587\\u4EF6")
        sys.exit(1)

    tmp_dir = tempfile.mkdtemp(prefix='saasyy_pdf_')
    pdf_pages = []

    try:
        toc_html = os.path.join(tmp_dir, '00_toc.html')
        toc_pdf = os.path.join(tmp_dir, '00_toc.pdf')
        create_toc_page(html_files, mp4_files, base_dir, toc_html)
        if html_to_pdf(toc_html, toc_pdf, browser):
            pdf_pages.append(toc_pdf)
            log(f"  \\u76EE\\u5F55\\u9875 -> OK")
        else:
            log(f"  \\u76EE\\u5F55\\u9875 -> \\u5931\\u8D25")

        for i, html_f in enumerate(html_files, 1):
            rel = os.path.relpath(html_f, base_dir)
            log(f"[{i}/{len(html_files)}] \\u8F6C\\u6362: {rel}")
            tmp_pdf = os.path.join(tmp_dir, f"page_{i:04d}.pdf")
            if html_to_pdf(html_f, tmp_pdf, browser):
                pdf_pages.append(tmp_pdf)
                log(f"  OK")
            else:
                log(f"  \\u5931\\u8D25")

        for mp4_f in mp4_files:
            vname = os.path.basename(mp4_f)
            log(f"\\u5904\\u7406\\u89C6\\u9891: {vname}")
            ph_html = os.path.join(tmp_dir, f"video_{vname}.html")
            ph_pdf = os.path.join(tmp_dir, f"video_{vname}.pdf")
            create_video_placeholder_page(mp4_f, ph_html)
            if html_to_pdf(ph_html, ph_pdf, browser):
                pdf_pages.append(ph_pdf)
                log(f"  \\u5360\\u4F4D\\u9875 OK")

        log(f"\\u5408\\u5E76 PDF...")
        if merge_pdfs(pdf_pages, output_pdf):
            log(f"\\u5D4C\\u5165\\u89C6\\u9891...")
            embed_videos(output_pdf, mp4_files)

        log(f"\\n\\u5B8C\\u6210! \\u6587\\u4EF6: {output_pdf}")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
`
}

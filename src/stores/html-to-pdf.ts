import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHtmlToPdfStore = defineStore('htmlToPdf', () => {
  const htmlContent = ref(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>\u6587\u6863\u6807\u9898</title>
<style>
body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.8; padding: 20px; color: #333; }
h1 { color: #1a1a1a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
p { margin: 12px 0; }
code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
</style>
</head>
<body>
<h1>\u6B22\u8FCE\u4F7F\u7528 HTML \u8F6C PDF \u5DE5\u5177</h1>
<p>\u5728\u5DE6\u4FA7\u7F16\u8F91\u5668\u4E2D\u7C98\u8D34\u60A8\u7684 HTML \u4EE3\u7801\uFF0C\u53F3\u4FA7\u5C06\u5B9E\u65F6\u9884\u89C8\u6E32\u67D3\u6548\u679C\u3002</p>
<p>\u8C03\u6574\u7F8E\u89C2\u7684\u9875\u9762\u5927\u5C0F\u548C\u8FB9\u8DDD\u540E\uFF0C\u70B9\u51FB\u201C\u5BFC\u51FA PDF\u201D\u5373\u53EF\u4FDD\u5B58\u3002</p>
</body>
</html>`)
  const htmlTitle = ref('\u6587\u6863\u6807\u9898')
  const pageSize = ref<'A4' | 'Letter' | 'Legal'>('A4')
  const margin = ref(10)

  function setHtmlContent(val: string) {
    htmlContent.value = val
    const titleMatch = val.match(/<title>([^<]*)<\/title>/i)
    htmlTitle.value = titleMatch ? titleMatch[1] : '\u65E0\u6807\u9898\u6587\u6863'
  }

  function loadHtmlFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        setHtmlContent(text)
        resolve()
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  function getPrintStyle(): string {
    return `
@media print {
  @page {
    size: ${pageSize.value};
    margin: ${margin.value}mm;
  }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
  }
  img { max-width: 100%; height: auto; }
  a { text-decoration: none; color: inherit; }
  pre, code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10pt;
    white-space: pre-wrap;
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 8px; }
}
    `.trim()
  }

  return {
    htmlContent,
    htmlTitle,
    pageSize,
    margin,
    setHtmlContent,
    loadHtmlFile,
    getPrintStyle,
  }
})

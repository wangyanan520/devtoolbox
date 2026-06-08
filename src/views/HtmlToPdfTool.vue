<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useHtmlToPdfStore } from '@/stores/html-to-pdf'
import { useToast } from '@/composables/useToast'
import MonacoEditor from '@/components/json/MonacoEditor.vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const store = useHtmlToPdfStore()
const toast = useToast()
const iframeRef = ref<HTMLIFrameElement>()
const previewKey = ref(0)
const isExporting = ref(false)

function onHtmlChange(value: string) {
  store.setHtmlContent(value)
  refreshPreview()
}

function refreshPreview() {
  previewKey.value++
  nextTick(() => {
    renderPreview()
  })
}

function renderPreview() {
  const iframe = iframeRef.value
  if (!iframe) return
  const doc = iframe.contentDocument
  if (!doc) return
  doc.open()
  const styledHtml = store.htmlContent.replace(
    '</head>',
    "<style>" + store.getPrintStyle() + "</style>\n</head>",
  )
  doc.write(styledHtml)
  doc.close()
}

function importHtmlFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.html,.htm'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件过大', '请使用不超过 5MB 的 HTML 文件')
      return
    }

    await store.loadHtmlFile(file)
    refreshPreview()
    toast.success('导入成功', file.name)
  }
  input.click()
}

async function exportPdf() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const fullHtml = store.htmlContent.replace(
      '</head>',
      "<style>\n@page { size: " + store.pageSize + "; margin: " + store.margin + "mm; }\nbody { margin: 0; padding: 0; }\n" + store.getPrintStyle() + "\n</style>\n</head>",
    )

    const container = document.createElement('div')
    container.innerHTML = fullHtml
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '794px'
    document.body.appendChild(container)

    await new Promise((resolve) => setTimeout(resolve, 800))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      backgroundColor: '#ffffff',
    })

    document.body.removeChild(container)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdfFormat = store.pageSize.toLowerCase()
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pdfFormat,
    })

    const margin = store.margin
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const usableW = pdfW - margin * 2
    const usableH = pdfH - margin * 2

    const imgW = usableW
    const imgH = (canvas.height * imgW) / canvas.width

    let remainingH = imgH
    let srcY = 0
    let page = 0

    while (remainingH > 0) {
      if (page > 0) pdf.addPage()

      const pageImgH = Math.min(remainingH, usableH)
      const srcH = (pageImgH * canvas.width) / imgW

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = srcH
      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(pageImgData, 'JPEG', margin, margin, imgW, pageImgH)

      srcY += srcH
      remainingH -= pageImgH
      page++
    }

    const safeName = store.htmlTitle.replace(/[<>:"/\\|?*]/g, '_') || 'document'
    pdf.save(safeName + '.pdf')

    toast.success('PDF 导出成功', '共 ' + page + ' 页')
  } catch (err) {
    const msg = err && typeof err === 'object' && 'message' in err ? (err as Error).message : '未知错误'
    toast.error('PDF 导出失败', msg)
    console.error('PDF export error:', err)
  } finally {
    isExporting.value = false
  }
}

watch([store.pageSize, store.margin], () => {
  renderPreview()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">HTML 转 PDF</h2>
        <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          粘贴 HTML → 预览 → 导出 PDF
        </span>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700/30">
        <div class="px-4 py-1.5 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">HTML 编辑器</span>
        </div>
        <div class="flex-1 overflow-hidden">
          <MonacoEditor
            :model-value="store.htmlContent"
            @update:model-value="onHtmlChange"
            language="html"
          />
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="px-4 py-1.5 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">实时预览</span>
        </div>
        <div class="flex-1 bg-white dark:bg-gray-900">
          <iframe
            ref="iframeRef"
            :key="previewKey"
            class="w-full h-full border-0"
            sandbox="allow-same-origin"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500 dark:text-gray-400">页面:</label>
            <select
              v-model="store.pageSize"
              class="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-400/40"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500 dark:text-gray-400">边距:</label>
            <input
              v-model.number="store.margin"
              type="number"
              min="5"
              max="50"
              class="text-xs w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-400/40"
            />
            <span class="text-xs text-gray-400">mm</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="importHtmlFile"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            导入文件
          </button>
          <button
            @click="exportPdf"
            :disabled="isExporting"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
            :class="isExporting
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'"
          >
            <svg
              v-if="!isExporting"
              class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <svg
              v-else
              class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>{{ isExporting ? '导出中…' : '导出 PDF' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { generatePdfConverterScript } from '@/components/saasyy-downloader/pdfConverterScriptTemplate'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const activeStep = ref(1)

const steps = [
  { id: 1, title: '下载脚本', desc: '获取 PDF 合成工具' },
  { id: 2, title: '安装依赖', desc: 'pip install pypdf' },
  { id: 3, title: '执行合成', desc: '生成最终 PDF' },
]

function downloadScript() {
  const content = generatePdfConverterScript()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'convert_to_pdf.py'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('脚本已下载', '请将脚本放到教程目录同级位置')
  activeStep.value = 2
}

function copyCmd(cmd: string) {
  navigator.clipboard.writeText(cmd)
  toast.success('已复制', cmd)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">PDF 合成器</h2>
        <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          将下载的教程目录一键合成为 PDF
        </span>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-[260px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700/30 p-4 overflow-y-auto space-y-4">
        <div class="space-y-0">
          <div
            v-for="(step, idx) in steps"
            :key="step.id"
            class="relative flex items-start gap-3 pb-6"
            :class="{ 'opacity-40': step.id > activeStep + 1 }"
          >
            <div
              v-if="idx < steps.length - 1"
              class="absolute left-[14px] top-7 w-0.5 h-6 rounded-full"
              :class="step.id <= activeStep ? 'bg-primary-400' : 'bg-gray-200 dark:bg-gray-700'"
            />
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
              :class="step.id <= activeStep
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'"
            >
              {{ step.id <= activeStep ? '✓' : step.id }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ step.title }}</p>
              <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{{ step.desc }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800 pt-3">
          <h4 class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">目录结构预览</h4>
          <div class="text-[11px] font-mono text-gray-500 dark:text-gray-400 space-y-1">
            <div>SaaSSY教程/</div>
            <div class="pl-3">├─ 01-工作台/</div>
            <div class="pl-6">└─ 01-工作台.html</div>
            <div class="pl-3">├─ 02-资料/</div>
            <div class="pl-6">├─ 01-基础资料.html</div>
            <div class="pl-6">└─ 02-标签分配.html</div>
            <div class="pl-3">└─ 03-培训视频/</div>
            <div class="pl-6">├─ 01-基础设置.mp4</div>
            <div class="pl-6">└─ 02-收费功能.mp4</div>
            <div class="mt-2 text-primary-500">↓ 合并后</div>
            <div>SaaSSY教程.pdf</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800 pt-3">
          <h4 class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">PDF 内容结构</h4>
          <div class="text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
            <div>■ 目录页</div>
            <div>■ 01-工作台</div>
            <div>■ 02-资料</div>
            <div>■ 03-培训视频</div>
            <div class="text-red-400">■ 视频附件</div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-2xl mx-auto space-y-5">

          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300"
            :class="{ 'ring-2 ring-primary-400/40': activeStep === 1 }">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">1</span>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">下载合成脚本</h3>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              点击下方按钮下载 <code class="text-primary-500 font-mono">convert_to_pdf.py</code>，
              放到教程目录旁边。
            </p>
            <div class="flex items-center gap-3">
              <button
                @click="downloadScript"
                class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 shadow-sm transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                下载 convert_to_pdf.py
              </button>
              <span class="text-xs text-gray-400">约 7KB</span>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300"
            :class="{ 'ring-2 ring-primary-400/40': activeStep === 2 }">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">安装依赖</h3>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              在终端执行以下命令，安装 Python 依赖（只需一次）：
            </p>

            <div class="relative group">
              <div class="p-3 rounded-lg bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono leading-relaxed">
                <span class="text-gray-500"># 安装 PDF 合并库</span><br />
                pip install pypdf
              </div>
              <button
                @click="copyCmd('pip install pypdf')"
                class="absolute top-2 right-2 px-2 py-1 rounded text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                复制
              </button>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300"
            :class="{ 'ring-2 ring-primary-400/40': activeStep === 3 }">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">3</span>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">执行合成</h3>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              在 <code class="text-primary-500 font-mono">SaaSSY教程/</code> 所在目录执行：
            </p>

            <div class="relative group">
              <div class="p-3 rounded-lg bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono leading-relaxed">
                <span class="text-gray-500"># 基本用法，输出为 SaaSSY教程.pdf</span><br />
                python convert_to_pdf.py ./SaaSSY教程
              </div>
              <button
                @click="copyCmd('python convert_to_pdf.py ./SaaSSY教程')"
                class="absolute top-2 right-2 px-2 py-1 rounded text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                复制
              </button>
            </div>

            <div class="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">更多命令</p>
              <div class="text-[11px] font-mono text-gray-600 dark:text-gray-400 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span>指定输出文件:</span>
                  <button @click="copyCmd('python convert_to_pdf.py ./SaaSSY教程 ./全部教程.pdf')" class="text-primary-500 hover:text-primary-400 text-[10px]">
                    复制
                  </button>
                </div>
                <code class="block p-1.5 rounded bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">python convert_to_pdf.py ./SaaSSY教程 ./全部教程.pdf</code>
              </div>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">▶ 运行效果</h3>
            <div class="p-4 rounded-lg bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono leading-relaxed">
              <span class="text-gray-500">$ python convert_to_pdf.py ./SaaSSY教程</span><br />
              [PDF] 输入目录: D:/SaaSSY教程<br />
              [PDF] 输出文件: D:/SaaSSY教程.pdf<br />
              [PDF] 使用浏览器: chrome.exe<br />
              [PDF] 找到 12 个 HTML 文件, 3 个 MP4 文件<br />
              [PDF] 目录页 -> OK<br />
              [PDF] [1/12] 转换: 01-工作台/01-工作台.html<br />
              [PDF] [2/12] 转换: 02-资料/01-基础资料.html<br />
              <span class="text-gray-500">...</span><br />
              [PDF] 合并完成: 15,234,567 字节<br />
              [PDF] 嵌入视频: 01-基础设置.mp4<br />
              [PDF] 嵌入视频: 02-收费功能.mp4<br />
              <br />
              <span class="text-green-300">✓ 完成! 文件: D:/SaaSSY教程.pdf</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-200 dark:border-amber-900/30">
            <div class="flex items-start gap-2">
              <span class="text-base flex-shrink-0">⚠</span>
              <div class="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p class="font-medium">注意事项</p>
                <p>• 需要电脑已安装 Chrome 或 Edge 浏览器</p>
                <p>• 第一次用需执行 <code class="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">pip install pypdf</code></p>
                <p>• 视频作为 PDF 附件嵌入，可以从 PDF 中提取</p>
                <p>• 输入目录应为下载脚本生成的带序号目录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

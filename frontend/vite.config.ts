import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/')

          if (
            moduleId.includes('/node_modules/react/') ||
            moduleId.includes('/node_modules/react-dom/') ||
            moduleId.includes('/node_modules/react-router-dom/')
          ) {
            return 'react-vendor'
          }

          if (moduleId.includes('/node_modules/html2canvas')) {
            return 'canvas-vendor'
          }

          if (moduleId.includes('/node_modules/jspdf')) {
            return 'pdf-vendor'
          }

          if (
            moduleId.includes('/src/pages/manager/reports/') ||
            moduleId.includes('/src/utils/reportPdf') ||
            moduleId.includes('/src/utils/invoiceReadyPacketPdf')
          ) {
            return 'reports'
          }

          if (
            moduleId.includes('/src/pages/manager/JobTicketDetailPage') ||
            moduleId.includes('/src/pages/manager/JobTicketEditorForm') ||
            moduleId.includes('/src/pages/manager/jobTicketDetail/')
          ) {
            return 'job-ticket-workbench'
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
    exclude: ['**/node_modules/**', 'e2e/**']
  }
})

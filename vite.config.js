import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        sender: 'sender.html',
        receiver: 'receiver.html'
      }
    }
  }
})

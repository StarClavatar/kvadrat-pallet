import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Отправляем кастомное событие, на которое подпишется React-компонент
    document.dispatchEvent(
      new CustomEvent('swUpdate', { detail: updateSW })
    );
  },
})
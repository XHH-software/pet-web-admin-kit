import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const name = ref(localStorage.getItem('name') || '')

  const isLogin = computed(() => !!token.value)

  function setLogin({ token: newToken, name: newName }) {
    token.value = newToken
    name.value = newName
    localStorage.setItem('token', newToken)
    if (newName) {
      localStorage.setItem('name', newName)
    }
  }

  function logout() {
    token.value = ''
    name.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('name')
  }

  return { token, name, isLogin, setLogin, logout }
})

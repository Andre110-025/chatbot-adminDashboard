import { reactive, ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAdminStore = defineStore('admin', () => {
  const userInfo = reactive({
    full_name: '',
    email: '',
    phone_number: '',
    business_name: '',
    website: '',
    full_address: '',
    userId: '',
    expiry_date: '',
  })

  const token = ref(null)

  const productId = ref([])

  function setProductId(params) {}

  const isLoggedIn = computed(() => !!token.value || !!userInfo.email)

  function setUser(user) {
    userInfo.full_name = user.full_name
    userInfo.email = user.email
    userInfo.phone_number = user.phone_number
    userInfo.business_name = user.business_name
    userInfo.website = user.website
    userInfo.full_address = user.full_address
    userInfo.userId = user.userId
    userInfo.expiry_date = user.expiry_date
    localStorage.setItem('allUser_Info', JSON.stringify(user))
  }

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  function loadFromStorage() {
    const savedUser = localStorage.getItem('allUser_Info')
    const savedToken = localStorage.getItem('auth_token')

    if (savedUser) {
      const user = JSON.parse(savedUser)
      Object.assign(userInfo, user)
    }

    if (savedToken) {
      token.value = savedToken
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
  }

  const resetData = reactive({
    userId: '',
  })

  // Call this at store initialization
  loadFromStorage()

  function logout() {
    token.value = null
    userInfo.full_name = ''
    userInfo.email = ''
    userInfo.phone_number = ''
    userInfo.business_name = ''
    userInfo.website = ''
    userInfo.full_address = ''
    userInfo.userId = ''
    userInfo.expiry_date = ''
    delete axios.defaults.headers.common['Authorization']
  }

  function deleteUser() {
    userInfo.full_name = ''
    userInfo.email = ''
    userInfo.phone_number = ''
    userInfo.business_name = ''
    userInfo.website = ''
    userInfo.full_address = ''
    userInfo.userId = ''
    userInfo.expiry_date = ''
    token.value = null

    localStorage.removeItem('allUser_Info')
    localStorage.removeItem('auth_token')
    delete axios.defaults.headers.common['Authorization']
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    setUser,
    setToken,
    loadFromStorage,
    resetData,
    logout,
    deleteUser,
  }
})

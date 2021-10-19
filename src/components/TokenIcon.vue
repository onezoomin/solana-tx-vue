<template>
  <h1>{{ msg }}</h1>
  <p class="mb-5">Semantified Offline Cached Tx History Browser</p>
</template>

<script setup lang="ts">
  import { TokenAccount } from '@/Model/Token'
  import { defineProps } from '@vue/runtime-core'
  import { onMounted, ref } from 'vue'
  defineProps<{ tokenAccount: TokenAccount }>()
  const tokenInfo = ref()
  onMounted(async () => {
    console.log('mounted!')
    tokenInfo.value = await (
      await TokenSpecificQuery(tokenAccount.mintAddress)
    )?.getTokenAccounts()
    console.log(offlineDB, tokenAccounts)
  })
</script>

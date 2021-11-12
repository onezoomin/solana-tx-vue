<template>
  <img width="32" style="margin: 2px" :src="iconURI" />
</template>

<script setup lang="ts">
  import { TokenAccount } from '@/Model/Token'
  import { defineProps } from '@vue/runtime-core'
  import { onMounted, Ref, ref } from 'vue'

  const props = defineProps<{ tokenAccount: TokenAccount }>()
  const iconURI: Ref<string> = ref('../src/assets/qs.png')
  onMounted(async () => {
    if (props.tokenAccount) {
      const tokenInfo = await props.tokenAccount.getTokenInfo()
      iconURI.value = tokenInfo?.logoURI ?? '../src/assets/qs.png'
    } else {
      console.log('no token account in props', props)
    }
  })
</script>

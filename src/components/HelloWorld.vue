<template>
  <h1>{{ msg }}</h1>
  <p class="mb-5">Semantified Offline Cached Tx History Browser</p>
</template>

<script setup lang="ts">
  import { defineProps } from '@vue/runtime-core'
  defineProps<{ msg: string }>()
</script>

<template>
  <v-expansion-panels class="token-account-txs">
    <v-expansion-panel v-for="(eachTx, i) in txArray" :key="i">
      <v-expansion-panel-header>
        {{ fd(eachTx.blockTime) }} -
        <a target="_blank" :href="`https://solscan.io/tx/${eachTx.sig}`">
          {{ eachTx.shortSig }}<v-icon large> mdi-open-in-new </v-icon>
        </a>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list-item-group>
          <v-list-item v-for="(eachInst, i) in eachTx.instructions" :key="i">
            <v-list-item-content>
              <v-list-item-title>
                <pre>
                  inst# {{ i }} <br/> {{ s(eachInst.info, null, 1) }}
                </pre>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
  import { TransactionsForSigArray } from '@/Data/data'
  import { SemanticTransaction } from '@/Model/MetaTransaction'
  import { TokenAccount } from '@/Model/Token'
  import {
    getSigArrayForTokenAccount,
    getTxsForAddress,
  } from '@/Utils/solana-utils'
  import { defineProps } from '@vue/runtime-core'
  import formatWithOptions from 'date-fns/fp/formatWithOptions'
  import { onMounted, Ref, ref } from 'vue'

  const l = console.log
  const s = JSON.stringify
  const fd = formatWithOptions({}, 'y d MMM k:mm:ss')
  const props = defineProps<{ tokenAccount: TokenAccount }>()
  const txArray: Ref<SemanticTransaction[]> = ref([])
  onMounted(async () => {
    const { tokenAccount } = props

    if (tokenAccount) {
      const sigs = await getSigArrayForTokenAccount(tokenAccount.address58)
      // console.log(limit, sigs.length)

      const txs = (await TransactionsForSigArray(sigs)).filter((t) => !!t)
      if (txs.length === sigs.length) {
        // setLoading(false)
        return (txArray.value = txs)
      }
      const more = await getTxsForAddress(tokenAccount.address58)
      // setLoading(false)
      return (txArray.value = more)
    } else {
      console.log('no token account in props', props)
    }
  })
</script>

<style>
  .token-account-txs {
    max-width: 640px;
    white-space: pre;
    text-align: left;
  }
</style>

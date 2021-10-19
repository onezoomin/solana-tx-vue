<template>
  <div class="container">
    <img alt="Solana logo" width="200" src="../assets/solana-sol-logo.svg" />
    <HelloWorld msg="Solana Transaction Explorer" />
    <div class="buttons-container">
      <v-input messages="['Enter your address']" @value="address">
        {{ address }}
      </v-input>
      <v-list>
        <v-list-item-group v-model="tokenAccounts">
          <v-list-item v-for="(item, i) in tokenAccounts" :key="i" two-line>
            <v-list-item-content>
              <v-list-item-title>{{ item.short }}</v-list-item-title>
              <v-list-item-subtitle>{{
                item.balance.uiAmountString
              }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <v-btn class="ma-2" color="primary" elevation="0" dark @click="count++">
        <span> Count: {{ count }} </span>
      </v-btn>
      <v-btn
        class="ma-2"
        color="primary"
        elevation="0"
        dark
        @click="store.dispatch('changeAuth', !auth)"
      >
        <span> {{ auth ? 'Log out' : 'Login' }} </span>
      </v-btn>
      <v-btn
        class="ma-2"
        color="primary"
        elevation="0"
        @click="$router.push('/pagetwo')"
      >
        Go to protected page
      </v-btn>
    </div>
    <div class="state-container">
      {{ auth ? 'Logged in' : 'Logged out' }}
      <v-btn
        v-if="auth"
        elevation="0"
        small
        class="ma-2"
        text
        icon
        color="blue lighten-2"
      >
        <v-icon class="icon"> mdi-thumb-up </v-icon>
      </v-btn>
      <v-btn
        v-else
        elevation="0"
        small
        class="ma-2"
        text
        icon
        color="red lighten-2"
      >
        <v-icon class="icon"> mdi-thumb-down </v-icon>
      </v-btn>
    </div>
    <a href="https://github.com/peshanghiwa" target="_blank" class="creator"
      >Peshang Hiwa</a
    >
  </div>
</template>
<script setup lang="ts">
  import { computed, ref, onMounted } from '@vue/runtime-core'
  import HelloWorld from '../components/HelloWorld.vue'
  import { key } from '../store'
  import { useStore } from 'vuex'
  import { AddressSpecificQuery } from '@/Data/data'
  import { offlineDB } from '@/Data/offline'
  import { TokenAccount } from '@/Model/Token'

  const count = ref(0)
  const address = ref('35tTtkZGrNrt5j3SwBykjb1mkS7Ty8deggZLBDrvxcbA')

  const tokenAccounts = ref([] as TokenAccount[])

  // useLiveQuery(ActiveAddressesQuery, [offlineDB.initialized]) ?? []
  const store = useStore(key)
  const auth = computed(() => {
    return store.getters.getAuth
  })
  onMounted(async () => {
    console.log('mounted!')
    tokenAccounts.value = await (
      await AddressSpecificQuery(address.value)
    )?.getTokenAccounts()
    console.log(offlineDB, tokenAccounts)
  })
</script>
<style scoped lang="scss">
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding-top: 60px;
    text-align: center;
  }
  .creator {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    text-decoration: none;
    color: black;
  }
  .icon {
    color: white;
  }
</style>

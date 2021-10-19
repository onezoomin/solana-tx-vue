import { decodeInstruction } from '@project-serum/serum'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as solW3 from '@solana/web3.js'
import Timeout from 'await-timeout'
import base58 from 'bs58'
import { offlineDB } from '../Data/offline'
import { Address } from '../Model/Address'
import { AddressStatus } from '../Model/AddressStatus'
import { NewOrderInstruction } from '../Model/Instructions/NewOrderInstruction'
import { RawTransaction, SemanticTransaction } from '../Model/MetaTransaction'
import { TokenAccount, TokenInfo } from '../Model/Token'

export const solCnx = new solW3.Connection('https://api.mainnet-beta.solana.com') // https://solana-api.projectserum.com //https://api.mainnet-beta.solana.com  https://solapeswap.rpcpool.com/

const pendingInits = new Map()
export async function getMintForTokenAccount (tokenAcc: TokenAccount): Promise<string> {
  if (pendingInits.has(tokenAcc.mintAddress)) await Timeout.set(2000) //
  if (tokenAcc.mintAddress) return tokenAcc.mintAddress
  pendingInits.set(tokenAcc.mintAddress, true)
  const startThrottle = 100 + pendingInits.size * 500
  await Timeout.set(startThrottle) // throttle
  const tokenInfo = await solCnx.getParsedAccountInfo(tokenAcc.publicKey)
  pendingInits.delete(tokenAcc.mintAddress)
  return ((tokenInfo.value?.data) as solW3.ParsedAccountData).parsed?.info?.mint ?? ''
}
export async function getBalanceForTokenAccount (tokenAcc: TokenAccount): Promise<number> {
  return await solCnx.getBalance(tokenAcc.publicKey)
}
export async function getTokenInfoForTokenAccount (tokenAcc: TokenAccount): Promise<TokenInfo | undefined> {
  const mint = tokenAcc.mintAddress ?? await getMintForTokenAccount(tokenAcc)
  // console.log(`mint info for ${mint} `, tokenAcc)
  return await offlineDB.TokenInfos.get(mint)
}

export async function initSol (addressObj: Address) {
  if (pendingInits.has(addressObj.address58)) {
    return
  }
  pendingInits.set(addressObj.address58, true)
  const startThrottle = 100 + pendingInits.size * 5000
  console.log('waiting for init', startThrottle)

  await Timeout.set(startThrottle) // throttle
  console.log('TOKEN_PROGRAM_ID', TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID.toString())
  const solBalance = await solCnx.getBalance(addressObj.publicKey) //, {limit:50}
  console.log(`sol for ${addressObj.short}`, solBalance)
  await Timeout.set(pendingInits.size * 1000) // throttle
  const tokenAccounts = await solCnx.getTokenAccountsByOwner(addressObj.publicKey, { programId: TOKEN_PROGRAM_ID }) //, {limit:50}
  const tokenAccountObjs: TokenAccount[] = tokenAccounts.value.map(eachAccount => new TokenAccount({
    address: eachAccount.pubkey.toBase58(),
    ownerAddress: addressObj.address58,
  }))
  console.log(`tokens accounts for ${addressObj.short}`, tokenAccountObjs, tokenAccounts)
  const ownedTokens: TokenInfo[] = []
  let ta = 0
  for (const eachTokenAddress of tokenAccountObjs) {
    const eachInfo = await eachTokenAddress.getTokenInfo()
    eachInfo && ownedTokens.push(eachInfo)
  }
  console.log(`ownedTokens for ${addressObj.short}`, ownedTokens)
  addressObj.tokens = ownedTokens
  // addressObj.getTokenAccounts() = tokenAccountObjs
  if (addressObj.status === AddressStatus.Active) {
    await offlineDB.ActiveAddresses.put(addressObj)
    if (tokenAccountObjs?.length) {
      ta = 0
      for (const eachAcc of tokenAccountObjs) {
        await Timeout.set(ta++ * 300) // throttle

        const balResponse = await solCnx.getTokenAccountBalance(eachAcc.publicKey)
        // console.log(addressObj.short, eachAcc, balResponse)
        eachAcc.balance = balResponse.value
      }
      await offlineDB.TokenAccounts.bulkPut(tokenAccountObjs)
    }
  } else {
    // await offlineDB.CompletedAddresses.put(address) // should not get called for completed addresses
  }
  pendingInits.delete(addressObj.address58)
}

export const serumProgram58 = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'

async function fetchRawTx (sig58: string): Promise<RawTransaction | undefined> {
  const txFromRPC = await solCnx.getConfirmedTransaction(sig58)
  if (txFromRPC) {
    const newRawTx = {
      ...txFromRPC,
      sig58: base58.encode(txFromRPC.transaction.signature ?? '??'),
    }
    void offlineDB.RawTransactions.put(newRawTx)
    return newRawTx
  }
  console.warn('failed fetch')
}
export async function getRawTx (sig58: string, isForceFetch?: boolean): Promise<RawTransaction | undefined> {
  let returnTx: RawTransaction | undefined
  if (!isForceFetch) returnTx = await offlineDB.RawTransactions.get(sig58) // attempt cache
  return returnTx ?? await fetchRawTx(sig58)
}

export async function getSigArrayForTokenAccount (address58: string, limit = 10) {
  const pk = new solW3.PublicKey(address58)
  const sigs = await solCnx.getConfirmedSignaturesForAddress2(pk, { limit })
  return sigs.map(({ signature }) => signature)
}
export async function getTxsForAddress (address58: string, limit = 20) {
  const stSigs = performance.now()
  const sigArray = await getSigArrayForTokenAccount(address58, limit)
  console.log(`fetching ${sigArray.length} (limit: ${limit}) sigs took ${performance.now() - stSigs}ms`)

  const stCache = performance.now()
  const cachedTxs = await offlineDB.Transactions.bulkGet(sigArray)
  let sigArrayUncached: string[]
  let cacheHits: string[] = []
  if (cachedTxs?.length) {
    cacheHits = cachedTxs.filter((t) => !!t).map(tx => tx?.sig)
    sigArrayUncached = sigArray.filter((sig) => !cacheHits.includes(sig))
  } else {
    sigArrayUncached = sigArray
  }
  console.log(`fetching ${cacheHits?.length} cached txs took ${performance.now() - stCache}ms`)
  const uncachedCount = sigArrayUncached.length
  if (uncachedCount) {
    let txsArray: solW3.ParsedConfirmedTransaction[] = []

    console.log(`fetching ${uncachedCount} uncached txs`)
    const st = performance.now()
    console.groupCollapsed('txs within parsed fetching')

    for (let sl = 0; sl <= sigArrayUncached.length; sl += 10) {
      const sigArrayFetch = sigArrayUncached.slice(sl, sl + 10)
      const moreTxs = (await solCnx.getParsedConfirmedTransactions(sigArrayFetch)).filter(tx => !!tx)
      if (moreTxs) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        moreTxs.forEach(async (eachTx, i) => {
          if (!eachTx) return
          const eachSig = eachTx.transaction.signatures[0]
          const shortSig = `${eachSig.substr(0, 6)}`
          eachTx?.transaction.message.instructions.forEach((eachInst, insti) => {
            eachInst.programId58 = eachInst.programId.toBase58()
            if (eachInst.data && eachInst.programId58 === serumProgram58) {
              eachInst.dataBytes = base58.decode(eachInst.data)
              try {
                eachInst.decData = decodeInstruction(eachInst.dataBytes)
                if (eachInst.decData.hasOwnProperty('newOrderV3')) eachInst.newOrder = new NewOrderInstruction(eachInst.decData.newOrderV3)
              } catch (e) {
                console.log(e)
              }
              console.log(`serum instruction for tx ${i} (${shortSig}) inst[${insti}]`, eachInst)
            }
          })
          if (eachTx) {
            const newTx = new SemanticTransaction({
              sig: eachSig,
              parsedTx: eachTx,
            })
            cachedTxs.push(newTx)
            await offlineDB.Transactions.put(newTx)
          }
        })
        txsArray = txsArray.concat(moreTxs as solW3.ParsedConfirmedTransaction[])
      }
    }
    console.groupEnd()
    console.log(`fetching ${uncachedCount} txs took ${performance.now() - st}ms`, txsArray)
  }
  const txs = uncachedCount ? await offlineDB.Transactions.bulkGet(sigArray) : cachedTxs
  console.log(`sigs and tx for ${address58}`, sigArray.length, txs)
  return txs
}

import { Strategy, TokenListProvider } from '@solana/spl-token-registry'
import Dexie from 'dexie'
import { Address } from '../Model/Address'
import { getInitialActiveAddresses, getInitialCompletedAddresses } from '../Model/Addresses'
import { RawTransaction, SemanticInstruction, SemanticTransaction } from '../Model/MetaTransaction'
import { TokenAccount, TokenInfo } from '../Model/Token'

// https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
class OfflineDB extends Dexie {
  initialized: boolean = false
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  ActiveAddresses: Dexie.Table<Address, string> // string = type of the primkey
  CompletedAddresses: Dexie.Table<Address, string>
  TokenInfos: Dexie.Table<TokenInfo, string>
  TokenAccounts: Dexie.Table<TokenAccount, string>
  Transactions: Dexie.Table<SemanticTransaction, string>
  RawTransactions: Dexie.Table<RawTransaction, string>
  Instructions: Dexie.Table<SemanticInstruction, string>
  // ...other tables go here...

  async init (callback?: Function): Promise<void> {
    console.log('init', this.ActiveAddresses, await this.ActiveAddresses.count())

    // eslint-disable-next-line @typescript-eslint/return-await
    return new Promise<void>((resolve, reject) => {
      try {
        void this.ActiveAddresses.count((count) => {
          if (count === 0) {
            void this.ActiveAddresses.bulkAdd(getInitialActiveAddresses())
          } else {
            console.log('active addresses already in')
          }
        }).then(() => {
          void this.CompletedAddresses.count((count) => {
            if (count === 0) {
              void this.CompletedAddresses.bulkAdd(getInitialCompletedAddresses())
            } else {
              console.log('CompletedAddresses already in')
            }
          }).then(() => {
            void this.TokenInfos.count((count) => {
              if (count === 0) {
                void (new TokenListProvider().resolve(Strategy.CDN)).then((tokens) => {
                  const tokenList = tokens.filterByChainId(101).getList()
                  void this.TokenInfos.bulkAdd(tokenList as TokenInfo[])
                })
              }
            })
            this.initialized = true
            callback?.()
            resolve()
          })
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  constructor () {
    super('OfflineDB')
    this.version(2).stores({
      ActiveAddresses: 'address58',
      CompletedAddresses: 'address58',
      TokenInfos: 'address, symbol, name',
      TokenAccounts: 'address58, mintAddress, ownerAddress',
      Transactions: 'sig, signer',
      Instructions: 'sig, signer, key, index',
      // ...other tables go here...//
    })
    this.ActiveAddresses = this.table('ActiveAddresses')
    this.CompletedAddresses = this.table('CompletedAddresses')
    this.TokenInfos = this.table('TokenInfos')
    this.TokenAccounts = this.table('TokenAccounts')
    this.Transactions = this.table('Transactions')
    this.Instructions = this.table('Instructions')

    this.ActiveAddresses.mapToClass(Address)
    this.CompletedAddresses.mapToClass(Address)
    this.TokenInfos.mapToClass(TokenInfo)
    this.TokenAccounts.mapToClass(TokenAccount)
    this.Transactions.mapToClass(SemanticTransaction)
    // this.RawTransactions.mapToClass(RawTransaction)
    this.Instructions.mapToClass(SemanticInstruction)
  }
}
export const offlineDB = new OfflineDB()

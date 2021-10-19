import * as solW3 from '@solana/web3.js'
import { TokenAccountsForOwnerQuery } from '../Data/data'
import { formatAddressShort } from '../Utils/js-utils'
import { initSol } from '../Utils/solana-utils'
import { AddressStatus } from './AddressStatus'
import { TokenAccount, TokenInfo } from './Token'
export class Address {
  address58: string
  status: AddressStatus
  tokens: TokenInfo[]

  constructor({ address, status }: { address: string; status: AddressStatus }) {
    this.address58 = address
    this.status = status
    if (this.address58 && this.status === AddressStatus.Active) {
      void initSol(this)
    }
  }

  public get short(): string {
    return formatAddressShort(this.address58)
  }

  public async getTokenAccounts(): Promise<TokenAccount[]> {
    return await TokenAccountsForOwnerQuery(this.address58)
  }

  public get publicKey(): solW3.PublicKey {
    return new solW3.PublicKey(this.address58)
  }
}

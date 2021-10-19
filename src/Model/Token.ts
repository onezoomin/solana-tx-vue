import { TokenExtensions } from '@solana/spl-token-registry'
import * as solW3 from '@solana/web3.js'
import { formatAddressShort } from '../Utils/js-utils'
import {
  getBalanceForTokenAccount,
  getMintForTokenAccount,
  getTokenInfoForTokenAccount,
} from '../Utils/solana-utils'
export class TokenAccount {
  readonly address58: string
  readonly ownerAddress: string
  mintAddress: string
  balance: solW3.TokenAmount

  constructor({
    address,
    ownerAddress,
  }: {
    address: string
    ownerAddress: string
  }) {
    this.address58 = address
    this.ownerAddress = ownerAddress
    void this.fetchTokenMint()
  }

  public get publicKey(): solW3.PublicKey {
    return new solW3.PublicKey(this.address58)
  }

  public get short(): string {
    return formatAddressShort(this.address58)
  }

  public async fetchTokenMint(): Promise<void> {
    this.mintAddress = await getMintForTokenAccount(this)
  }

  public async fetchTokenBalance(): Promise<void> {
    if (this.mintAddress) {
      this.balance = await getBalanceForTokenAccount(this)
    } else {
      console.log('attempt to getBalance for unknown mint', this)
    }
  }

  public async getTokenInfo(): Promise<TokenInfo | undefined> {
    return await getTokenInfoForTokenAccount(this)
  }
}
export class TokenInfo {
  readonly chainId: number
  readonly address: string
  readonly name: string
  readonly decimals: number
  readonly symbol: string
  readonly logoURI?: string
  readonly tags?: string[]
  readonly extensions?: TokenExtensions

  constructor({ address }: { address: string }) {
    this.address = address
  }

  public get iconURI(): string {
    return this.logoURI ?? ''
  }

  public get short(): string {
    return formatAddressShort(this.address)
  }

  public get publicKey(): solW3.PublicKey {
    return new solW3.PublicKey(this.address)
  }
}

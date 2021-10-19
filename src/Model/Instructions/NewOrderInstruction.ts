import BN from 'bn.js'

export class NewOrderInstruction {
  clientId: number // BN {negative: 0, words: Array(3), length: 1, red: null}
  limit: number // 65535
  limitPrice: number // BN {negative: 0, words: Array(3), length: 1, red: null}
  maxBaseQuantity: number // BN {negative: 0, words: Array(3), length: 1, red: null}
  maxQuoteQuantity: number // BN {negative: 0, words: Array(3), length: 2, red: null}
  orderType: string // "limit"
  selfTradeBehavior: string // "decrementTake"
  side: string // "buy" // TODO enum

  constructor (
    { clientId, limit, limitPrice, maxBaseQuantity, maxQuoteQuantity, orderType, selfTradeBehavior, side }:
    {clientId: BN, limit: number, limitPrice: BN, maxBaseQuantity: BN, maxQuoteQuantity: BN, orderType: string, selfTradeBehavior: string, side: string},
  ) {
    this.clientId = clientId.toNumber()
    this.limit = limit
    this.limitPrice = limitPrice.toNumber()
    this.maxBaseQuantity = maxBaseQuantity.toNumber()
    this.maxQuoteQuantity = maxQuoteQuantity.toNumber()
    this.orderType = orderType
    this.selfTradeBehavior = selfTradeBehavior
    this.side = side
  }

  public get short (): string {
    return `${this.side} ${this.limit} @ ${this.limitPrice}`
  }
}

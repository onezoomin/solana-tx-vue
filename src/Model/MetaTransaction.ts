import { decodeInstruction } from '@project-serum/serum'
import { TokenExtensions } from '@solana/spl-token-registry'
import * as solW3 from '@solana/web3.js'
import base58 from 'bs58'
import toDate from 'date-fns/toDate'
import { formatAddressShort } from '../Utils/js-utils'
import { getRawTx, serumProgram58 } from '../Utils/solana-utils'
// Semantic means "better than parsed" - decoded, parsed, massaged, and reorganized to be human readable

export interface RawTransaction extends solW3.ConfirmedTransaction {
  sig58: string
}

export class SemanticInstructionOpts {
  innerInstructions?: solW3.ParsedInnerInstruction[]
  isInnerInstruction?: boolean
  key?: string // sigF6.index[.innerIndex] eg
  sig: string
  signer: string
  programId: solW3.PublicKey
  index: number
  info: Record<string, any> // decoded data as a simple object
  siblings: SemanticInstruction[] // inclusive set of ordered instructions from the parent tx

  constructor(options: SemanticInstructionOpts) {
    const {
      sig,
      signer,
      index,
      info,
      siblings,
      programId,
      innerInstructions,
      key = `${sig.substr(0, 6)}.${index}`,
      isInnerInstruction = !Number.isInteger(index),
    } = options
    Object.assign(this, {
      sig,
      key,
      signer,
      index,
      info,
      siblings,
      programId,
      ...(innerInstructions ? { innerInstructions } : {}),
      isInnerInstruction,
    })
  }
}
export class SemanticInstruction extends SemanticInstructionOpts {
  get programId58(): string {
    return this.programId.toBase58()
  }
}

const decodePDI = (eachInst) => {
  if (eachInst.data && eachInst.programId58 === serumProgram58) {
    const dataBytes = base58.decode(eachInst.data)
    try {
      const decData = decodeInstruction(dataBytes)
      return decData
    } catch (e) {
      console.warn(e)
    }
  } else {
    console.warn('unknown inst', eachInst)
  }
}
const semantifySingleInstruction = (
  eachI: solW3.PartiallyDecodedInstruction | solW3.ParsedInstruction,
  sig: string,
  signer: string,
  index: number,
  siblings: SemanticInstruction[]
) => {
  console.log('semantifying', index, sig.substr(0, 6))

  if ((eachI as solW3.PartiallyDecodedInstruction).data) {
    const { programId, accounts } = eachI as solW3.PartiallyDecodedInstruction
    const decodedInstructionObj = decodePDI(eachI)

    return new SemanticInstruction({
      info: {
        ...decodedInstructionObj,
        accounts,
      },
      sig,
      index,
      signer,
      siblings,
      programId,
    })
  }
  const pi = eachI as solW3.ParsedInstruction
  return new SemanticInstruction({
    info: {
      ...pi.parsed,
      programName: pi.program,
    },
    sig,
    index,
    signer,
    siblings,
    programId: pi.programId,
  })
}
const semantifyInstructions = (
  parsedTx: solW3.ParsedConfirmedTransaction,
  sig: string,
  signer: string
) => {
  const { instructions } = parsedTx.transaction.message
  const innerInstructions = parsedTx.meta?.innerInstructions ?? []
  const iiByIndex = {}
  for (const eachIiSet of innerInstructions) {
    const semantifiedInners: SemanticInstruction[] = []
    eachIiSet.instructions.forEach((eachIi, idx) => {
      const innerIndex = Number(`${eachIiSet.index}.${idx + 1}`)
      // note innerInstructions use a 1 based array so the index isInner integer check can work (there should never be an index of 1.0, the first is 1.1)
      semantifiedInners.push(
        semantifySingleInstruction(
          eachIi,
          sig,
          signer,
          innerIndex,
          semantifiedInners
        )
      )
    })
    iiByIndex[eachIiSet.index] = semantifiedInners
  }
  const semantified: SemanticInstruction[] = []
  instructions.forEach((eachI, idx) => {
    const semInst: SemanticInstruction = semantifySingleInstruction(
      eachI,
      sig,
      signer,
      idx,
      semantified
    )
    if (iiByIndex[idx]) semInst.innerInstructions = iiByIndex[idx]
    semantified.push(semInst)
  })
  return semantified
}
export class SemanticTransactionOpts {
  parsedTx: solW3.ParsedConfirmedTransaction
  sig?: string
  signer?: string
  blockTime?: Date
  instructions?: SemanticInstruction[]

  constructor({
    parsedTx,
    sig = parsedTx.transaction.signatures[0],
    signer = parsedTx.transaction.message.accountKeys[0].pubkey.toBase58(),
    blockTime = toDate((parsedTx.blockTime ?? 0) * 1000),
    instructions = semantifyInstructions(parsedTx, sig, signer),
  }: SemanticTransactionOpts) {
    Object.assign(this, { sig, signer, blockTime, instructions, parsedTx })
    // console.log(parsedTx.blockTime, blockTime)
  }
}
export class SemanticTransaction extends SemanticTransactionOpts {
  public async getRawTx(): Promise<RawTransaction | undefined> {
    return await getRawTx(this.sig)
  }

  public get shortSig(): string {
    return this.sig.substr(0, 6)
  }

  public get signerPublicKey(): solW3.PublicKey {
    return new solW3.PublicKey(this.signer)
  }
}
// Meta means that they include all 3 refs: raw, parsed and semantic versions of the data
export class MetaTransaction {
  readonly sig: string
  readonly signer: string
  parsedTx: solW3.ParsedConfirmedTransaction
  tx: SemanticTransaction

  constructor({
    sig,
    parsedTx,
  }: {
    sig: string
    parsedTx: solW3.ParsedConfirmedTransaction
  }) {
    this.sig = sig
    this.parsedTx = parsedTx

    this.signer = parsedTx.transaction.message.accountKeys[0].pubkey.toBase58()

    this.tx = new SemanticTransaction({ sig, parsedTx, signer: this.signer })
  }

  public async getRawTx(): Promise<RawTransaction | undefined> {
    return await getRawTx(this.sig)
  }

  public get shortSig(): string {
    return this.sig.substr(0, 6)
  }

  public get signerPublicKey(): solW3.PublicKey {
    return new solW3.PublicKey(this.signer)
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

import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getOrCreateAssociatedTokenAccount } from './getOrCreateAssociatedTokenAccount'
import { createTransferInstruction } from './createTransferInstructions'

interface Props {
    children: (sendTransaction: OnSendTransaction) => React.ReactNode
}

type OnSendTransaction = (toPublicKey: string, tokenAddress: string, amount: number) => void

// Docs: https://github.com/solana-labs/solana-program-library/pull/2539/files
// https://github.com/solana-labs/wallet-adapter/issues/189
// repo: https://github.com/solana-labs/example-token/blob/v1.1/src/client/token.js
// creating a token for testing: https://learn.figment.io/tutorials/sol-mint-token
const SendTransaction: React.FC<Props> = ({ children }) => {
    const { connection } = useConnection()
    const { publicKey, signTransaction, sendTransaction } = useWallet()

    const onSendSPLTransaction = useCallback(
        async (toPubkey: string, tokenAddress: string, amount: number) => {
            console.log({ toPubkey, tokenAddress, amount })
            if (!toPubkey || !amount) return
            const toastId = toast.loading('Processing transaction...')

            try {
              if (!publicKey || !signTransaction) throw new WalletNotConnectedError()
                const toPublicKey = typeof toPubkey === 'string' ? new PublicKey(toPubkey) : toPubkey
                const mint = new PublicKey(tokenAddress)

                console.log('1st getOrCreateAssociatedTokenAccount call')
                const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    publicKey,
                    mint,
                    publicKey,
                    signTransaction
                )

                console.log('2nd getOrCreateAssociatedTokenAccount call')
                const toTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    publicKey,
                    mint,
                    toPublicKey,
                    signTransaction
                )

                console.log('create transaction using createTransferInstruction')
                const transaction = new Transaction().add(
                    createTransferInstruction(
                        fromTokenAccount.address, // source
                        toTokenAccount.address, // dest
                        publicKey,
                        amount * LAMPORTS_PER_SOL,
                        [],
                        TOKEN_PROGRAM_ID
                    )
                )

                console.log('get blockhash and signature')
                const blockHash = await connection.getRecentBlockhash()
                transaction.feePayer = await publicKey
                transaction.recentBlockhash = await blockHash.blockhash
                const signed = await signTransaction(transaction)

                await connection.sendRawTransaction(signed.serialize())
                console.log('finished sending transaction')

                toast.success('Transaction sent', {
                    id: toastId,
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
              toast.error(`Transaction failed: ${error.message}`, {
                id: toastId,
              })
              console.error({ error })
              throw new Error(error)
            }
        },
        [publicKey, sendTransaction, connection]
    )

    return <>{children(onSendSPLTransaction)}</>
}

export default SendTransaction

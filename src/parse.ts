import { Coin, CoinSpend } from "datalayer-driver"

export function parseCoin(coin: any): Coin {
  return {
    parentCoinInfo: Buffer.from(coin.parent_coin_info, 'hex'),
    puzzleHash: Buffer.from(coin.puzzle_hash, 'hex'),
    amount: BigInt(coin.amount),
  }
}

export function parseCoinSpends(coinSpends: any[]): CoinSpend[] {
  return coinSpends.map((coinSpend: any) => {
    return {
      coin: parseCoin(coinSpend.coin),
      puzzleReveal: Buffer.from(coinSpend.puzzle_reveal, 'hex'),
      solution: Buffer.from(coinSpend.solution, 'hex'),
    }
  });
}

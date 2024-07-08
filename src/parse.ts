import { Coin, CoinSpend, DataStoreInfo, DataStoreMetadata, DelegatedPuzzle, Proof } from "datalayer-driver"

export function parseCoin(coin: any): Coin {
  return {
    parentCoinInfo: Buffer.from(coin.parent_coin_info.replace('0x', ''), 'hex'),
    puzzleHash: Buffer.from(coin.puzzle_hash.replace('0x', ''), 'hex'),
    amount: BigInt(coin.amount),
  }
}

export function parseCoinSpends(coinSpends: any[]): CoinSpend[] {
  return coinSpends.map((coinSpend: any) => {
    return {
      coin: parseCoin(coinSpend.coin),
      puzzleReveal: Buffer.from(coinSpend.puzzle_reveal.replace('0x', ''), 'hex'),
      solution: Buffer.from(coinSpend.solution.replace('0x', ''), 'hex'),
    }
  });
}

export function parseProof(proof: any): Proof {
  if (!proof.amount) {
    return {
      lineageProof: {
        parentParentCoinId: Buffer.from(proof.parent_parent_coin_id.replace('0x', ''), 'hex'),
        parentInnerPuzzleHash: Buffer.from(proof.parent_inner_puzzle_hash.replace('0x', ''), 'hex'),
        parentAmount: BigInt(proof.parent_amount),
      }
    }
  } else {
    return {
      eveProof: {
        parentCoinInfo: Buffer.from(proof.parent_coin_info.replace('0x', ''), 'hex'),
        amount: BigInt(proof.amount),
      }
    }
  }
}

export function parseDataStoreMetadata(metadata: any): DataStoreMetadata {
  return {
    rootHash: Buffer.from(metadata.root_hash.replace('0x', ''), 'hex'),
    label: metadata.label,
    description: metadata.description,
  };
}

export function parseDelegatedPuzzle(delegatedPuzzle: any): DelegatedPuzzle {
  return {
    puzzleHash: Buffer.from(delegatedPuzzle.puzzle_hash.replace('0x', ''), 'hex'),
    puzzleInfo: {
      adminInnerPuzzleHash: delegatedPuzzle.puzzle_info.admin_inner_puzzle_hash ? Buffer.from(delegatedPuzzle.puzzle_info.admin_inner_puzzle_hash.replace('0x', ''), 'hex') : undefined,
      writerInnerPuzzleHash: delegatedPuzzle.puzzle_info.writer_inner_puzzle_hash ? Buffer.from(delegatedPuzzle.puzzle_info.writer_inner_puzzle_hash.replace('0x', ''), 'hex') : undefined,
      oraclePaymentPuzzleHash: delegatedPuzzle.puzzle_info.oracle_payment_puzzle_hash ? Buffer.from(delegatedPuzzle.puzzle_info.oracle_payment_puzzle_hash.replace('0x', ''), 'hex') : undefined,
      oracleFee: delegatedPuzzle.puzzle_info.oracle_fee ? BigInt(delegatedPuzzle.puzzle_info.oracle_fee) : undefined,
    }
  };
}

export function parseDataStoreInfo(info: any): DataStoreInfo {
  return {
    coin: parseCoin(info.coin),
    launcherId: Buffer.from(info.launcher_id.replace('0x', ''), 'hex'),
    proof: parseProof(info.proof),
    metadata: parseDataStoreMetadata(info.metadata),
    ownerPuzzleHash: Buffer.from(info.owner_puzzle_hash.replace('0x', ''), 'hex'),
    delegatedPuzzles: info.delegated_puzzles.map(parseDelegatedPuzzle),
  };
}

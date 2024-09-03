import { Coin, CoinSpend, DataStore, DataStoreMetadata, DelegatedPuzzle, Proof } from "datalayer-driver"

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
        parentParentCoinInfo: Buffer.from(proof.parent_parent_coin_info.replace('0x', ''), 'hex'),
        parentInnerPuzzleHash: Buffer.from(proof.parent_inner_puzzle_hash.replace('0x', ''), 'hex'),
        parentAmount: BigInt(proof?.parent_amount ?? proof.patent_amount), // typo in prev commits
      }
    }
  } else {
    return {
      eveProof: {
        parentParentCoinInfo: Buffer.from(proof.parent_parent_coin_info.replace('0x', ''), 'hex'),
        parentAmount: BigInt(proof.parent_amount),
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

export function parseDelegatedPuzzle(puzzleInfo: any): DelegatedPuzzle {
  return {
    adminInnerPuzzleHash: puzzleInfo.admin_inner_puzzle_hash ? Buffer.from(puzzleInfo.admin_inner_puzzle_hash.replace('0x', ''), 'hex') : undefined,
    writerInnerPuzzleHash: puzzleInfo.writer_inner_puzzle_hash ? Buffer.from(puzzleInfo.writer_inner_puzzle_hash.replace('0x', ''), 'hex') : undefined,
    oraclePaymentPuzzleHash: puzzleInfo.oracle_payment_puzzle_hash ? Buffer.from(puzzleInfo.oracle_payment_puzzle_hash.replace('0x', ''), 'hex') : undefined,
    oracleFee: puzzleInfo.oracle_fee ? BigInt(puzzleInfo.oracle_fee) : undefined,
  };
}

export function parseDataStore(datastore: any): DataStore {
  return {
    coin: parseCoin(datastore.coin),
    launcherId: Buffer.from(datastore.launcher_id.replace('0x', ''), 'hex'),
    proof: parseProof(datastore.proof),
    metadata: parseDataStoreMetadata(datastore.metadata),
    ownerPuzzleHash: Buffer.from(datastore.owner_puzzle_hash.replace('0x', ''), 'hex'),
    delegatedPuzzles: datastore.delegated_puzzles.map(parseDelegatedPuzzle),
  };
}

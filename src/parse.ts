import { Coin, CoinSpend, DataStoreInfo, DataStoreMetadata, DelegatedPuzzle, Proof } from "datalayer-driver"

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

export function parseProof(proof: any): Proof {
  if (!proof.amount) {
    return {
      lineageProof: {
        parentParentCoinId: Buffer.from(proof.parent_parent_coin_id, 'hex'),
        parentInnerPuzzleHash: Buffer.from(proof.parent_inner_puzzle_hash, 'hex'),
        parentAmount: BigInt(proof.parent_amount),
      }
    }
  } else {
    return {
      eveProof: {
        parentCoinInfo: Buffer.from(proof.eve_proof.parent_coin_info, 'hex'),
        amount: BigInt(proof.eve_proof.amount),
      }
    }
  }
}

export function parseDataStoreMetadata(metadata: any): DataStoreMetadata {
  return {
    rootHash: Buffer.from(metadata.root_hash, 'hex'),
    label: metadata.label,
    description: metadata.description,
  };
}

export function parseDelegatedPuzzle(delegatedPuzzle: any): DelegatedPuzzle {
  return {
    puzzleHash: Buffer.from(delegatedPuzzle.puzzle_hash, 'hex'),
    puzzleInfo: {
      adminInnerPuzzleHash: Buffer.from(delegatedPuzzle.puzzle_info.admin_inner_puzzle_hash, 'hex'),
      writerInnerPuzzleHash: Buffer.from(delegatedPuzzle.puzzle_info.writer_inner_puzzle_hash, 'hex'),
      oraclePaymentPuzzleHash: Buffer.from(delegatedPuzzle.puzzle_info.oracle_payment_puzzle_hash, 'hex'),
      oracleFee: BigInt(delegatedPuzzle.puzzle_info.oracle_fee),
    }
  };
}

export function parseDataStoreInfo(info: any): DataStoreInfo {
  return {
    coin: parseCoin(info.coin),
    launcherId: Buffer.from(info.launcher_id, 'hex'),
    proof: parseProof(info.proof),
    metadata: parseDataStoreMetadata(info.metadata),
    ownerPuzzleHash: Buffer.from(info.owner_puzzle_hash, 'hex'),
    delegatedPuzzles: info.delegated_puzzles.map(parseDelegatedPuzzle),
  };
}

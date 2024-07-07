import { Coin, DataStoreMetadata, DelegatedPuzzle, Proof, SuccessResponse } from "datalayer-driver";

export const formatCoin = (coin: Coin) => ({
  parent_coin_info: coin.parentCoinInfo.toString('hex'),
  puzzle_hash: coin.puzzleHash.toString('hex'),
  amount: parseInt(coin.amount.toString()),
});

export const formatProof = (proof: Proof): any => {
  if(proof.eveProof) {
    return {
      parent_coin_info: proof.eveProof.parentCoinInfo.toString('hex'),
      amount: parseInt(proof.eveProof.amount.toString()),
    };
  }

  return {
    parent_parent_coin_id: proof.lineageProof!.parentParentCoinId.toString('hex'),
    parent_inner_puzzle_hash: proof.lineageProof!.parentInnerPuzzleHash.toString('hex'),
    patent_amount: parseInt(proof.lineageProof!.parentAmount.toString()),
  };
}

export const formatMetadata = (metadata: DataStoreMetadata): any => {
  return {
    root_hash: metadata.rootHash.toString('hex'),
    label: metadata.label,
    description: metadata.description,
  }
}

export const formatDelegatedPuzzle = (dp: DelegatedPuzzle): any => {
  return {
    puzzle_hash: dp.puzzleHash.toString('hex'),
    puzzle_info: {
      admin_inner_puzzle_hash: dp.puzzleInfo.adminInnerPuzzleHash?.toString('hex'),
      writer_inner_puzzle_hash: dp.puzzleInfo.writerInnerPuzzleHash?.toString('hex'),
      oracle_payment_puzzle_hash: dp.puzzleInfo.oraclePaymentPuzzleHash?.toString('hex'),
      oracle_fee: dp.puzzleInfo.oracleFee ? parseInt(dp.puzzleInfo.oracleFee.toString()): undefined,
    }
  }
}

export const formatSuccessResponse = (response: SuccessResponse): any => {
  return {
    coin_spends: response.coinSpends.map((coinSpend) => ({
      coin: formatCoin(coinSpend.coin),
      puzzle_reveal: coinSpend.puzzleReveal.toString('hex'),
      solution: coinSpend.solution.toString('hex'),
    })),
    new_info: {
      coin: formatCoin(response.newInfo.coin),
      launcher_id: response.newInfo.launcherId.toString('hex'),
      proof: formatProof(response.newInfo.proof),
      metadata: formatMetadata(response.newInfo.metadata),
      owner_puzzle_hash: response.newInfo.ownerPuzzleHash.toString('hex'),
      delegated_puzzles: response.newInfo.delegatedPuzzles.map(formatDelegatedPuzzle),
    },
  };

}

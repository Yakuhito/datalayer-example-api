import { Coin, CoinSpend, DataStore, DataStoreMetadata, DelegatedPuzzle, Proof, SuccessResponse } from "datalayer-driver";

export const formatCoin = (coin: Coin) => ({
  parent_coin_info: '0x' + coin.parentCoinInfo.toString('hex'),
  puzzle_hash: '0x' + coin.puzzleHash.toString('hex'),
  amount: parseInt(coin.amount.toString()),
});

export const formatCoinSpend = (cs: CoinSpend) => ({
  coin: formatCoin(cs.coin),
  puzzle_reveal: '0x' + cs.puzzleReveal.toString('hex'),
  solution: '0x' + cs.solution.toString('hex'),
});

export const formatProof = (proof: Proof): any => {
  if(proof.eveProof) {
    return {
      parent_parent_coin_info: '0x' + proof.eveProof.parentParentCoinInfo.toString('hex'),
      parent_amount: parseInt(proof.eveProof.parentAmount.toString()),
    };
  }

  return {
    parent_parent_coin_info: '0x' + proof.lineageProof!.parentParentCoinInfo.toString('hex'),
    parent_inner_puzzle_hash: '0x' +  proof.lineageProof!.parentInnerPuzzleHash.toString('hex'),
    parent_amount: parseInt(proof.lineageProof!.parentAmount.toString()),
  };
}

export const formatMetadata = (metadata: DataStoreMetadata): any => {
  return {
    root_hash: '0x' + metadata.rootHash.toString('hex'),
    label: metadata.label,
    description: metadata.description,
  }
}

export const formatDelegatedPuzzle = (dp: DelegatedPuzzle): any => {
  return {
   admin_inner_puzzle_hash: dp.adminInnerPuzzleHash ? '0x' + dp.adminInnerPuzzleHash.toString('hex'): undefined,
    writer_inner_puzzle_hash: dp.writerInnerPuzzleHash ? '0x' + dp.writerInnerPuzzleHash.toString('hex'): undefined,
    oracle_payment_puzzle_hash: dp.oraclePaymentPuzzleHash ? '0x' + dp.oraclePaymentPuzzleHash.toString('hex'): undefined,
    oracle_fee: dp.oracleFee ? parseInt(dp.oracleFee.toString()): undefined,
  }
}

export const formatDataStore = (datastore: DataStore): any => {
  return {
    coin: formatCoin(datastore.coin),
    launcher_id: '0x' + datastore.launcherId.toString('hex'),
    proof: formatProof(datastore.proof),
    metadata: formatMetadata(datastore.metadata),
    owner_puzzle_hash: '0x' + datastore.ownerPuzzleHash.toString('hex'),
    delegated_puzzles: datastore.delegatedPuzzles.map(formatDelegatedPuzzle),
  };
}

export const formatSuccessResponse = (response: SuccessResponse): any => {
  return {
    coin_spends: response.coinSpends.map(formatCoinSpend),
    new_info: formatDataStore(response.newStore),
  };

}

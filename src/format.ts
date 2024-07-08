import { Coin, CoinSpend, DataStoreInfo, DataStoreMetadata, DelegatedPuzzle, Proof, SuccessResponse } from "datalayer-driver";

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
      parent_coin_info: '0x' + proof.eveProof.parentCoinInfo.toString('hex'),
      amount: parseInt(proof.eveProof.amount.toString()),
    };
  }

  return {
    parent_parent_coin_id: '0x' + proof.lineageProof!.parentParentCoinId.toString('hex'),
    parent_inner_puzzle_hash: '0x' +  proof.lineageProof!.parentInnerPuzzleHash.toString('hex'),
    patent_amount: parseInt(proof.lineageProof!.parentAmount.toString()),
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
    puzzle_hash: '0x' + dp.puzzleHash.toString('hex'),
    puzzle_info: {
      admin_inner_puzzle_hash: dp.puzzleInfo.adminInnerPuzzleHash ? '0x' + dp.puzzleInfo.adminInnerPuzzleHash.toString('hex'): undefined,
      writer_inner_puzzle_hash: dp.puzzleInfo.writerInnerPuzzleHash ? '0x' + dp.puzzleInfo.writerInnerPuzzleHash.toString('hex'): undefined,
      oracle_payment_puzzle_hash: dp.puzzleInfo.oraclePaymentPuzzleHash ? '0x' + dp.puzzleInfo.oraclePaymentPuzzleHash.toString('hex'): undefined,
      oracle_fee: dp.puzzleInfo.oracleFee ? parseInt(dp.puzzleInfo.oracleFee.toString()): undefined,
    }
  }
}

export const formatDataStoreInfo = (info: DataStoreInfo): any => {
  return {
    coin: formatCoin(info.coin),
    launcher_id: '0x' + info.launcherId.toString('hex'),
    proof: formatProof(info.proof),
    metadata: formatMetadata(info.metadata),
    owner_puzzle_hash: '0x' + info.ownerPuzzleHash.toString('hex'),
    delegated_puzzles: info.delegatedPuzzles.map(formatDelegatedPuzzle),
  };
}

export const formatSuccessResponse = (response: SuccessResponse): any => {
  return {
    coin_spends: response.coinSpends.map(formatCoinSpend),
    new_info: formatDataStoreInfo(response.newInfo),
  };

}

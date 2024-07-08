import { addressToPuzzleHash, adminDelegatedPuzzleFromKey, getCoinId, oracleDelegatedPuzzle, puzzleHashToAddress, signCoinSpends, SpendBundle, writerDelegatedPuzzleFromKey } from "datalayer-driver";
import { formatCoin, formatSuccessResponse } from "./format";
import { getPeer, getPrivateSyntheticKey, getPublicSyntheticKey, getServerPuzzleHash, MIN_HEIGHT, NETWORK_AGG_SIG_DATA, NETWORK_PREFIX } from "./utils";
import express, { Request, Response } from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import { parseCoin, parseCoinSpends } from "./parse";

const app = express();
const port = 3030;

app.use(cors());
app.use(bodyParser.json());

app.get('/info', async (req: Request, res: any) => {
  const ph = getServerPuzzleHash();
  const address = puzzleHashToAddress(ph, NETWORK_PREFIX);

  const peer = await getPeer();
  const coins = await peer.getCoins(ph, MIN_HEIGHT);

  res.json({
    address,
    coins: coins.map(formatCoin),
  })
});

app.post('/mint', async (req: Request, res: Response) => {
  const { root_hash, label, description, owner_address, fee, oracle_fee } : {
    root_hash: string,
    label: string,
    description: string,
    owner_address: string,
    fee: number,
    oracle_fee: number,
  } = req.body;

  const rootHash = Buffer.from(root_hash, 'hex');
  const ownerPuzzleHash = addressToPuzzleHash(owner_address);
  const feeBigInt = BigInt(fee);
  const oracleFeeBigInt = BigInt(oracle_fee);

  const serverPh = getServerPuzzleHash();
  const serverKey = getPublicSyntheticKey();

  const peer = await getPeer();
  const successResponse = await peer.mintStore(
    getPublicSyntheticKey(),
    MIN_HEIGHT,
    rootHash,
    label,
    description,
    ownerPuzzleHash,
    [
      adminDelegatedPuzzleFromKey(serverKey),
      writerDelegatedPuzzleFromKey(serverKey),
      oracleDelegatedPuzzle(serverPh, oracleFeeBigInt)
    ],
    feeBigInt
  );

  res.json(formatSuccessResponse(successResponse));
});

app.post('/sing_and_send', async (req: Request, res: Response) => {
  const { coin_spends } : {
    coin_spends: any[],
  } = req.body;
  const coinSpends = parseCoinSpends(coin_spends);

  const sig = signCoinSpends(coinSpends, [getPrivateSyntheticKey()], NETWORK_AGG_SIG_DATA);

  const spend_bundle: SpendBundle = {
    coinSpends: coinSpends,
    aggregatedSignature: sig,
  };

  const peer = await getPeer();
  const err = await peer.broadcastSpendBundle(spend_bundle);

  console.log({ err})

  res.json({ err });
});

app.post('/coin_confirmed', async (req: Request, res: Response) => {
  let { coin } : {
    coin: any,
  } = req.body;
  coin = parseCoin(coin);

  const peer = await getPeer();
  const confirmed = await peer.isCoinSpent(getCoinId(coin));

  console.log({ confirmed})

  res.json({ confirmed });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

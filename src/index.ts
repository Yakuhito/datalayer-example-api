import { addressToPuzzleHash, adminDelegatedPuzzleFromKey, getCoinId, meltStore, oracleDelegatedPuzzle, puzzleHashToAddress, signCoinSpends, SpendBundle, updateStoreMetadata, updateStoreOwnership, writerDelegatedPuzzleFromKey } from "datalayer-driver";
import { formatCoin, formatCoinSpend, formatDataStoreInfo, formatSuccessResponse } from "./format";
import { getPeer, getPrivateSyntheticKey, getPublicSyntheticKey, getServerPuzzleHash, MIN_HEIGHT, NETWORK_AGG_SIG_DATA, NETWORK_PREFIX } from "./utils";
import express, { Request, Response } from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import { parseCoin, parseCoinSpends, parseDataStoreInfo, parseDelegatedPuzzle } from "./parse";

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
      oracleDelegatedPuzzle(ownerPuzzleHash, oracleFeeBigInt)
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

app.post('/sync', async (req: Request, res: Response) => {
  let { info } : {
    info: any,
  } = req.body;
  info = parseDataStoreInfo(info);

  const peer = await getPeer();
  const resp = await peer.syncStore(info, MIN_HEIGHT);

  res.json({ info: formatDataStoreInfo(resp.latestInfo) });
});

app.post('/update-ownership', async (req: Request, res: Response) => {
  let { info, new_owner_puzzle_hash, new_delegated_puzzles, owner_public_key, admin_public_key } : {
    info: any,
    new_owner_puzzle_hash: string,
    new_delegated_puzzles: any[],
    owner_public_key?: string,
    admin_public_key?: string
  } = req.body;

  const resp = await updateStoreOwnership(
    parseDataStoreInfo(info),
    Buffer.from(new_owner_puzzle_hash, 'hex'),
    new_delegated_puzzles.map(parseDelegatedPuzzle),
    owner_public_key ? Buffer.from(owner_public_key, 'hex') : undefined,
    admin_public_key ? Buffer.from(admin_public_key, 'hex') : undefined,
  );

  res.json(formatSuccessResponse(resp));
});

app.post('/update-metadata', async (req: Request, res: Response) => {
  let { info, new_root_hash, new_label, new_description, owner_public_key, admin_public_key, writer_public_key } : {
    info: any,
    new_root_hash: string,
    new_label: string,
    new_description: string,
    owner_public_key?: string,
    admin_public_key?: string,
    writer_public_key?: string
  } = req.body;

  const resp = await updateStoreMetadata(
    parseDataStoreInfo(info),
    Buffer.from(new_root_hash, 'hex'),
    new_label,
    new_description,
    owner_public_key ? Buffer.from(owner_public_key, 'hex') : undefined,
    admin_public_key ? Buffer.from(admin_public_key, 'hex') : undefined,
    writer_public_key ? Buffer.from(writer_public_key, 'hex') : undefined,
  );

  res.json(formatSuccessResponse(resp));
});

app.post('/melt', async (req: Request, res: Response) => {
  let { info, owner_public_key } : {
    info: any,
    owner_public_key: string,
  } = req.body;

  const resp = await meltStore(
    parseDataStoreInfo(info),
    Buffer.from(owner_public_key, 'hex'),
  );

  res.json({ coin_spends: resp.map(formatCoinSpend) });
});

app.post('/add-fee', async (req: Request, res: Response) => {
  let { coin_ids, fee } : {
    coin_ids: string[],
    fee: number
  } = req.body;

  const peer = await getPeer();
  const resp = await peer.addFee(getPublicSyntheticKey(), MIN_HEIGHT, coin_ids.map((id) => Buffer.from(id, 'hex')), BigInt(fee));

  res.json({ coin_spends: resp.map(formatCoinSpend) });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

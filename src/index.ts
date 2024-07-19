import { addFee, addressToPuzzleHash, adminDelegatedPuzzleFromKey, getCoinId, meltStore, mintStore, oracleDelegatedPuzzle, oracleSpend, puzzleHashToAddress, selectCoins, signCoinSpends, updateStoreMetadata, updateStoreOwnership, writerDelegatedPuzzleFromKey } from "datalayer-driver";
import { formatCoin, formatCoinSpend, formatDataStoreInfo, formatSuccessResponse } from "./format";
import { getPeer, getPrivateSyntheticKey, getPublicSyntheticKey, getServerPuzzleHash, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH, NETWORK_AGG_SIG_DATA, NETWORK_PREFIX, SECRET_TOKEN } from "./utils";
import express, { Request, Response } from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import { parseCoin, parseCoinSpends, parseDataStoreInfo, parseDelegatedPuzzle, parseDelegatedPuzzleInfo } from "./parse";

const app = express();
const port = 3030;

app.use(cors());
app.use(bodyParser.json());

app.use((req: Request, res: Response, next) => {
  const secret = req.header('X-Secret');
  if (!secret || secret !== SECRET_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Missing X-Secret header' });
  }
  next();
});


app.get('/info', async (req: Request, res: any) => {
  const ph = getServerPuzzleHash();
  const address = puzzleHashToAddress(ph, NETWORK_PREFIX);

  const peer = await getPeer();
  const coinsResp = await peer.getAllUnspentCoins(ph, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);

  res.json({
    address,
    pk: getPublicSyntheticKey().toString('hex'),
    last_synced_block_height: coinsResp.lastHeight,
    last_synced_block_header_hash: coinsResp.lastHeaderHash.toString('hex'),
    coins: coinsResp.coins.map(formatCoin),
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

  const rootHash = Buffer.from(root_hash.replace('0x', ''), 'hex');
  const ownerPuzzleHash = addressToPuzzleHash(owner_address);
  const feeBigInt = BigInt(fee);
  const oracleFeeBigInt = BigInt(oracle_fee);

  const serverKey = getPublicSyntheticKey();

  const peer = await getPeer();

  // select coins
  const ph = getServerPuzzleHash();
  const coinsResp = await peer.getAllUnspentCoins(ph, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);
  const coins = selectCoins(coinsResp.coins, feeBigInt + BigInt(1));

  const successResponse = await mintStore(
    getPublicSyntheticKey(),
    coins,
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

app.post('/sing-and-send', async (req: Request, res: Response) => {
  const { coin_spends, signature } : {
    coin_spends: any[],
    signature?: string,
  } = req.body;
  const coinSpends = parseCoinSpends(coin_spends);

  const mySig = signCoinSpends(coinSpends, [getPrivateSyntheticKey()], NETWORK_AGG_SIG_DATA);

  const peer = await getPeer();
  const err = await peer.broadcastSpend(
    coinSpends,
    signature ? [mySig, Buffer.from(signature.replace('0x', ''), 'hex')] : [mySig]
  );

  console.log({ err})

  res.json({ err });
});

app.post('/coin-confirmed', async (req: Request, res: Response) => {
  let { coin } : {
    coin: any,
  } = req.body;
  coin = parseCoin(coin);

  const peer = await getPeer();
  const confirmed = await peer.isCoinSpent(getCoinId(coin), MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);

  console.log({ confirmed})

  res.json({ confirmed });
});

app.post('/sync', async (req: Request, res: Response) => {
  let { info } : {
    info: any,
  } = req.body;
  info = parseDataStoreInfo(info);

  const peer = await getPeer();
  const resp = await peer.syncStore(info, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);

  res.json({ info: formatDataStoreInfo(resp.latestInfo) });
});

app.post('/update-ownership', async (req: Request, res: Response) => {
  let { info, new_owner_puzzle_hash, new_delegated_puzzle_keys_and_types, owner_public_key, admin_public_key } : {
    info: any,
    new_owner_puzzle_hash: string,
    new_delegated_puzzle_keys_and_types: any[],
    owner_public_key?: string,
    admin_public_key?: string
  } = req.body;

  const resp = updateStoreOwnership(
    parseDataStoreInfo(info),
    Buffer.from(new_owner_puzzle_hash.replace('0x', ''), 'hex'),
    new_delegated_puzzle_keys_and_types.map((info) => {
      if(info.type === 'admin') {
        return adminDelegatedPuzzleFromKey(Buffer.from(info.key.replace('0x', ''), 'hex'));
      } else if(info.type === 'writer') {
        return writerDelegatedPuzzleFromKey(Buffer.from(info.key.replace('0x', ''), 'hex'));
      }

      return oracleDelegatedPuzzle(Buffer.from(info.puzzle_hash.replace('0x', ''), 'hex'), BigInt(info.fee));
    }),
    owner_public_key ? Buffer.from(owner_public_key.replace('0x', ''), 'hex') : null,
    admin_public_key ? Buffer.from(admin_public_key.replace('0x', ''), 'hex') : null,
  );

  res.json(formatSuccessResponse(resp));
});

app.post('/update-metadata', async (req: Request, res: Response) => {
  let { info, new_root_hash, new_label, new_description} : {
    info: any,
    new_root_hash: string,
    new_label: string,
    new_description: string,
  } = req.body;

  const owner_public_key = req.body.owner_public_key;
  const admin_public_key = req.body.admin_public_key;
  const writer_public_key = req.body.writer_public_key;

  const resp = updateStoreMetadata(
    parseDataStoreInfo(info),
    Buffer.from(new_root_hash.replace('0x', ''), 'hex'),
    new_label,
    new_description,
    owner_public_key ? Buffer.from(owner_public_key.replace('0x', ''), 'hex') : null,
    admin_public_key ? Buffer.from(admin_public_key.replace('0x', ''), 'hex') : null,
    writer_public_key ? Buffer.from(writer_public_key.replace('0x', ''), 'hex') : null,
  );

  res.json(formatSuccessResponse(resp));
});

app.post('/melt', async (req: Request, res: Response) => {
  let { info, owner_public_key } : {
    info: any,
    owner_public_key: string,
  } = req.body;

  const resp = meltStore(
    parseDataStoreInfo(info),
    Buffer.from(owner_public_key.replace('0x', ''), 'hex'),
  );

  res.json({ coin_spends: resp.map(formatCoinSpend) });
});


app.post('/oracle', async (req: Request, res: Response) => {
  let { info, fee } : {
    info: any,
    fee: number,
  } = req.body;

  const peer = await getPeer();

  // select coins
  const ph = getServerPuzzleHash();
  const coinsResp = await peer.getAllUnspentCoins(ph, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);
  const coins = selectCoins(coinsResp.coins, BigInt(fee));

  const resp = await oracleSpend(
    getPublicSyntheticKey(),
    coins,
    parseDataStoreInfo(info),
    BigInt(fee)
  )

  res.json(formatSuccessResponse(resp));
});

app.post('/add-fee', async (req: Request, res: Response) => {
  let { coins, fee } : {
    coins: any[],
    fee: number
  } = req.body;

  const coin_ids = coins.map(parseCoin).map((coin) => getCoinId(coin));

  const peer = await getPeer();

  // select coins
  const ph = getServerPuzzleHash();
  const coinsResp = await peer.getAllUnspentCoins(ph, MIN_HEIGHT, MIN_HEIGHT_HEADER_HASH);
  const selectedCoins = selectCoins(coinsResp.coins, BigInt(fee));

  const resp = await addFee(getPublicSyntheticKey(), selectedCoins, coin_ids, BigInt(fee));

  res.json({ coin_spends: resp.map(formatCoinSpend) });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

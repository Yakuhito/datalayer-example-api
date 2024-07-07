import { addressToPuzzleHash, puzzleHashToAddress } from "datalayer-driver";
import { formatCoin, formatSuccessResponse } from "./format";
import { getPeer, getPublicSyntheticKey, getServerPuzzleHash, MIN_HEIGHT, NETWORK_PREFIX } from "./utils";
import express, { Request, Response } from 'express';
import bodyParser from "body-parser";

const app = express();
const port = 3030;

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

  const peer = await getPeer();
  const successResponse = await peer.mintStore(
    getPublicSyntheticKey(),
    MIN_HEIGHT,
    rootHash,
    label,
    description,
    ownerPuzzleHash,
    [],
    feeBigInt
  );

  res.json(formatSuccessResponse(successResponse));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

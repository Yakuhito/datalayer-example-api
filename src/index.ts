import { Coin, masterPublicKeyToFirstPuzzleHash, Tls, Peer, puzzleHashToAddress, secretKeyToPublicKey } from "datalayer-driver";
import path from "path";
import os from 'os';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

const NETWORK_PREFIX = process.env.NETWORK_PREFIX || 'txch';
const CHIA_CRT = process.env.CHIA_CRT || path.join(os.homedir(), '.chia-testnet11/mainnet/config/ssl/full_node/public_full_node.crt');
const CHIA_KEY = process.env.CHIA_KEY || path.join(os.homedir(), '/.chia-testnet11/mainnet/config/ssl/full_node/public_full_node.key');

let peer: Peer | null = null;
export const getPeer = async (): Promise<Peer> => {
  if (!peer) {
    const tls = new Tls(CHIA_CRT, CHIA_KEY);
    peer = await Peer.new('127.0.0.1:58444', 'mainnet', tls);
  }

  return peer!;
};

const formatCoin = (coin: Coin) => ({
  parentCoinInfo: coin.parentCoinInfo.toString('hex'),
  puzzleHash: coin.puzzleHash.toString('hex'),
  amount: coin.amount,
});

app.get('/info', async (req: Request, res: any) => {
  const master_sk = Buffer.from(process.env.SERVER_SK as string, 'hex');
  const master_pk = secretKeyToPublicKey(master_sk);
  const ph = masterPublicKeyToFirstPuzzleHash(master_pk);
  const address = puzzleHashToAddress(ph, NETWORK_PREFIX);

  const peer = await getPeer();
  const coins = await peer.getCoins(ph, 1016697);

  res.json({
    address,
    coins: coins.map(formatCoin),
  })
});

// app.post('/mint', async (req, res) => {
//   const { root_hash, label, description, ownerAddress, fee, oracle_fee } = req.body;

//   try {
//     const tls = new Tls('path_to_cert', 'path_to_key'); // Update paths as necessary
//     const peer = await Peer.new('nodeUri', 'networkId', tls);

//     const rootHashBuffer = Buffer.from(root_hash, 'hex');
//     const ownerPuzzleHashBuffer = Buffer.from(ownerAddress, 'hex');
//     const feeBigInt = BigInt(fee);
//     const oracleFeeBigInt = BigInt(oracle_fee);

//     const successResponse = await peer.mintStore(
//       Buffer.from('minterSyntheticKey', 'hex'), // Replace with actual key
//       0, // minterPhMinHeight, update as necessary
//       rootHashBuffer,
//       label,
//       description,
//       ownerPuzzleHashBuffer,
//       [], // delegatedPuzzles, update as necessary
//       feeBigInt
//     );

//     res.json(successResponse);
//   } catch (error) {
//     console.error('Error minting store:', error);
//     res.status(500).json({ error: 'Failed to mint store' });
//   }
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

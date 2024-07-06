import { Coin, masterPublicKeyToFirstPuzzleHash, puzzleHashToAddress, secretKeyToPublicKey } from "datalayer-driver";

const express = require('express');
const bodyParser = require('body-parser');
const { Peer, Tls } = require('datalayer-driver');
const app = express();
const port = 3000;

const NETWORK_PREFIX = process.env.NETWORK_PREFIX || 'txch';

app.use(bodyParser.json());

const formatCoin = (coin: Coin) => ({
  parentCoinInfo: coin.parentCoinInfo.toString('hex'),
  puzzleHash: coin.puzzleHash.toString('hex'),
  amount: coin.amount,
});

app.get('/info', (req: Request, res: any) => {
  const master_sk = Buffer.from(process.env.SERVER_SK as string, 'hex');
  const master_pk = secretKeyToPublicKey(master_sk);
  console.log('master_pk: ', master_pk.toString('hex'));
  const ph = masterPublicKeyToFirstPuzzleHash(master_pk);
  const address = puzzleHashToAddress(ph, NETWORK_PREFIX);

  res.json({
    address
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

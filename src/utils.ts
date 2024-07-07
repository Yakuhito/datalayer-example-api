import { masterPublicKeyToFirstPuzzleHash, Tls, Peer, secretKeyToPublicKey, masterPublicKeyToWalletSyntheticKey, masterSecretKeyToWalletSyntheticSecretKey } from "datalayer-driver";
import os from 'os';
import path from "path";

export const NETWORK_PREFIX = process.env.NETWORK_PREFIX || 'txch';
export const CHIA_CRT = process.env.CHIA_CRT || path.join(os.homedir(), '.chia-testnet11/mainnet/config/ssl/wallet/wallet_node.crt');
export const CHIA_KEY = process.env.CHIA_KEY || path.join(os.homedir(), '.chia-testnet11/mainnet/config/ssl/wallet/wallet_node.key');
export const MIN_HEIGHT = parseInt(process.env.MIN_HEIGHT || '1016697');

// todo: persist peer; wallet logic
export const getPeer = async (): Promise<Peer> => {
  const tls = new Tls(CHIA_CRT, CHIA_KEY);
  return Peer.new('127.0.0.1:58444', 'testnet11', tls);
};

export const getPublicSyntheticKey = (): Buffer => {
  const master_sk = Buffer.from(process.env.SERVER_SK as string, 'hex');
  const master_pk = secretKeyToPublicKey(master_sk);

  return masterPublicKeyToWalletSyntheticKey(master_pk);
}

export const getPrivateSyntheticKey = (): Buffer => {
  const master_sk = Buffer.from(process.env.SERVER_SK as string, 'hex');

  return masterSecretKeyToWalletSyntheticSecretKey(master_sk);
}

export const getServerPuzzleHash = (): Buffer => {
  const master_sk = Buffer.from(process.env.SERVER_SK as string, 'hex');
  const master_pk = secretKeyToPublicKey(master_sk);

  return masterPublicKeyToFirstPuzzleHash(master_pk);
}

import { masterPublicKeyToFirstPuzzleHash, Peer, secretKeyToPublicKey, masterPublicKeyToWalletSyntheticKey, masterSecretKeyToWalletSyntheticSecretKey } from "datalayer-driver";
import os from 'os';
import path from "path";

export const NETWORK_PREFIX = process.env.NETWORK_PREFIX || 'txch';
export const CHIA_CRT = process.env.CHIA_CRT || path.join(os.homedir(), '.chia-testnet11/mainnet/config/ssl/wallet/wallet_node.crt');
export const CHIA_KEY = process.env.CHIA_KEY || path.join(os.homedir(), '.chia-testnet11/mainnet/config/ssl/wallet/wallet_node.key');
export const MIN_HEIGHT = parseInt(process.env.MIN_HEIGHT || '1068656');
export const MIN_HEIGHT_HEADER_HASH = Buffer.from(process.env.MIN_HEIGHT_HEADER_HASH || '8cd77da3fb583dae6c6a5ec2f2c814330924aecd10cc367779e827bc65e2737c', 'hex');
export const NETWORK_AGG_SIG_DATA = Buffer.from(process.env.NETWORK_AGG_SIG_DATA || '37a90eb5185a9c4439a91ddc98bbadce7b4feba060d50116a067de66bf236615', 'hex');

// todo: persist peer; wallet logic
export const getPeer = async (): Promise<Peer> => {
  return Peer.new('127.0.0.1:58444', 'testnet11', CHIA_CRT, CHIA_KEY);
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

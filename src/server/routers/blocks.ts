import dotenv from '@dotenvx/dotenvx';

dotenv.config();

import Web3, { BlockHeaderOutput, LogsOutput } from 'web3';
import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { router, publicProcedure } from 'server/trpc';
import { observable } from '@trpc/server/observable';
import { readFileSync, writeFile } from 'fs';
import process from 'node:process';
import { debounce, sortBy } from 'lodash';

// Connect to an Ethereum node
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.NEXT_ALCHEMY_WSS!),
);

const BLOCK_LIMIT = 11;

export type BlockInfo = {
  erc20TxCount: number;
  number: string;
  baseFee: string;
  gasUsed: string;
  gasLimit: string;
};

type BlockInfoEvents = {
  error: (error: Error) => void;
  blocks: (blocks: BlockInfo[]) => void;
};

let blocks: BlockInfo[] = [];

export const blocksEmitter =
  new EventEmitter() as TypedEmitter<BlockInfoEvents>;

const writeAndEmit = debounce(
  () => {
    blocks = sortBy(blocks, (b) => -parseFloat(b.number));
    writeFile('./blocks.json', JSON.stringify(blocks), (e) =>
      e ? console.error(e) : undefined,
    );
    blocksEmitter.emit('blocks', blocks);
  },
  1000,
  { trailing: true },
);

try {
  blocks = JSON.parse(readFileSync('./blocks.json').toString()) as BlockInfo[];
} catch {
  // do nothing
}

(async () => {
  const blockNumber = await web3.eth.getBlockNumber();

  while (blocks.length < BLOCK_LIMIT) {
    const lastNumber =
      Number(blocks[blocks.length - 1]?.number) || Number(blockNumber);

    const block = await web3.eth.getBlock(lastNumber - 1);
    blocks.push({
      number: block.number.toString(),
      erc20TxCount: 0,
      baseFee: block.baseFeePerGas?.toString() ?? '0',
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
    });
    writeAndEmit();
  }
})();

// The ERC20 Token Contract Address
const tokenAddress =
  process.env.NEXT_ERC20_ADDRESS ||
  '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // Replace with the actual contract address

// The ERC20 Token Transfer Event Signature Hash
// This is a constant for all ERC20 tokens (Transfer event)
const transferEventSignature =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

web3.eth
  .subscribe('newBlockHeaders')
  .then((sub) => {
    const onData = (block: BlockHeaderOutput) => {
      if (block.number === undefined) return;
      const blockInfo: BlockInfo = {
        number: block.number.toString(),
        erc20TxCount: 0,
        baseFee: block.baseFeePerGas?.toString() ?? '0',
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString(),
      };
      if (blockInfo.number) {
        blocks.unshift(blockInfo);
        if (blocks.length > BLOCK_LIMIT) {
          blocks.pop();
        }
        writeAndEmit();
      }
    };

    sub.on('data', onData);

    process.on('beforeExit', () => {
      sub.off('data', onData);
    });
  })
  .catch((e) => {
    console.error('newBlockHeaders subscription failed', e);
  });

web3.eth
  .subscribe('logs', {
    address: tokenAddress,
    topics: [transferEventSignature],
  })
  .then((sub) => {
    const onLog = (log: LogsOutput) => {
      if (!log.blockNumber) return;
      const block = blocks.find(
        (b) => b.number === log.blockNumber!.toString(),
      );

      if (!block) {
        return;
      }

      block.erc20TxCount += 1;

      writeAndEmit();
    };

    sub.on('data', onLog);

    process.on('beforeExit', () => {
      sub.off('data', onLog);
    });
  })
  .catch((e) => {
    console.error('logs subscription failed', e);
  });

export default router({
  getCurrent: publicProcedure.query(() => blocks.slice(1)),
  onChange: publicProcedure.subscription(() => {
    return observable<BlockInfo[]>((emit) => {
      const onBlocks = (data: BlockInfo[]) => {
        emit.next(data.slice(1));
      };

      blocksEmitter.on('blocks', onBlocks);
      return () => {
        blocksEmitter.off('blocks', onBlocks);
      };
    });
  }),
});

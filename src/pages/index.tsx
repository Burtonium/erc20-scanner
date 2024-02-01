import { trpc } from '../utils/trpc';
import Head from 'next/head';
import { animated, config, Spring } from 'react-spring';
import { useEffect, useMemo, useState } from 'react';
import { BlockInfo } from 'server/routers/blocks';

function roundUpToHighest10(n: number): number {
  return Math.ceil(n / 10) * 10;
}

export default function IndexPage() {
  const [blocks, setBlocks] = useState<BlockInfo[]>();
  const blocksQuery = trpc.blocks.getCurrent.useQuery();
  trpc.blocks.onChange.useSubscription(undefined, { onData: setBlocks });

  const maxTxCount = useMemo(
    () =>
      roundUpToHighest10(
        blocks ? Math.max(...blocks.map((b) => b.erc20TxCount)) : 0,
      ),
    [blocks],
  );

  useEffect(() => setBlocks(blocksQuery.data), [blocksQuery.data]);

  return (
    <>
      <Head>
        <title>ERC20 Scanner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grid">
        <div className="flex w-full items-center flex-col">
          <div className="flex flex-col bg-gray-50 rounded h-96 p-10 max-w-full overflow-x-auto mt-10">
            <div className="pb-6 pl-3">
              <p>USDT Transfers per Block</p>
            </div>

            <div className="flex flex-row bg-gray-50 rounded h-full max-w-full overflow-x-auto">
              {blocks?.map((block, index) => (
                <div
                  className="flex flex-col justify-center items-center mx-3 h-full w-16 p-0"
                  key={block.number}
                >
                  <div className="flex flex-col justify-end items-end rounded bg-gray-100 h-5/6 w-16 p-0">
                    {maxTxCount !== 0 && (
                      <Spring
                        config={config.wobbly}
                        delay={index * 100}
                        from={{ opacity: 0, height: '0%' }}
                        to={{
                          opacity: 1,
                          height: (block.erc20TxCount / maxTxCount) * 100 + '%',
                        }}
                      >
                        {(props) => (
                          <animated.div
                            style={{
                              ...props,
                            }}
                            className="flex justify-center items-center rounded bg-yellow-300 min-w-full h-10 text-sm"
                          >
                            {block.erc20TxCount || 0}
                          </animated.div>
                        )}
                      </Spring>
                    )}
                  </div>
                  <label className="flex justify-center items-center h-1/6">
                    {block.number || ''}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

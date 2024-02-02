import { trpc } from '../utils/trpc';
import Head from 'next/head';
import { animated, config, Spring } from 'react-spring';
import { useEffect, useMemo, useState } from 'react';
import { BlockInfo } from 'server/routers/blocks';
import Spinner from './_components/Spinner';
import { interpolateColor } from './_utils/colors';

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

  const maxBaseFee = useMemo(
    () =>
      roundUpToHighest10(
        blocks ? Math.max(...blocks.map((b) => Number(b.baseFee))) / 1e9 : 0,
      ),
    [blocks],
  );

  const gasUsedOverLimitPercents = useMemo(
    () =>
      blocks?.map((b) =>
        ((Number(b.gasUsed) / Number(b.gasLimit)) * 100).toFixed(2),
      ),
    [blocks],
  );

  useEffect(() => setBlocks(blocksQuery.data), [blocksQuery.data]);

  const colors1 = useMemo(() => interpolateColor('#fde047', '#2dd4bf', 10), []);
  const colors2 = useMemo(() => interpolateColor('#2dd4bf', '#60a5fa', 10), []);
  const colors3 = useMemo(() => interpolateColor('#60a5fa', '#e879f9', 10), []);

  return (
    <>
      <Head>
        <title>ERC20 Scanner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grid">
        <div className="flex w-full items-center flex-col pb-20 pt-16">
          {!blocks ? (
            <Spinner />
          ) : (
            <>
              <div className="flex flex-col bg-gray-50 rounded h-96 p-10 max-w-full overflow-x-auto">
                <div className="pb-6 pl-3 text-xl font-semibold">
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
                              height:
                                (block.erc20TxCount / maxTxCount) * 100 + '%',
                            }}
                          >
                            {(props) => (
                              <animated.div
                                style={{
                                  ...props,
                                  backgroundColor: colors1[index],
                                }}
                                className="flex justify-center items-center rounded min-w-full h-10 text-sm"
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
              <div className="flex flex-col bg-gray-50 rounded h-96 p-10 max-w-full overflow-x-auto mt-10">
                <div className="pb-6 pl-3 text-xl font-semibold">
                  <p>Basefee Per Block (gwei)</p>
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
                              height:
                                ((Number(block.baseFee) / maxBaseFee) * 100) /
                                  1e9 +
                                '%',
                            }}
                          >
                            {(props) => (
                              <animated.div
                                style={{
                                  ...props,
                                  backgroundColor: colors2[index],
                                }}
                                className="flex justify-center items-center rounded min-w-full h-10 text-sm"
                              >
                                {(Number(block.baseFee) / 1e9).toFixed(2) || 0}
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
              <div className="flex flex-col bg-gray-50 rounded h-96 p-10 max-w-full overflow-x-auto mt-10">
                <div className="pb-6 pl-3 text-xl font-semibold">
                  <p>Ratio of gasUsed/gasLimit (%)</p>
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
                              height: gasUsedOverLimitPercents?.[index] + '%',
                            }}
                          >
                            {(props) => (
                              <animated.div
                                style={{
                                  ...props,
                                  backgroundColor: colors3[index],
                                }}
                                className="flex justify-center items-center rounded min-w-full h-10 text-sm"
                              >
                                {gasUsedOverLimitPercents?.[index] + '%' || 0}
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
              <div className="bg-gray-50 rounded p-10 max-w-[60rem] mt-10">
                <h2 className="text-2xl mb-6">Information</h2>
                <p>
                  In Ethereum, the base fee adjusts dynamically, aiming to keep
                  blocks about 50% full. When the gasUsed exceeds 50% of the
                  gasLimit, indicating high demand, the base fee increases to
                  discourage excessive usage and balance the next block&apos;s
                  load. Conversely, if the gasUsed is below 50%, suggesting
                  lower demand, the base fee decreases to encourage more
                  transactions. This adjustment mechanism strives for an
                  equilibrium, making gas fees more predictable and managing
                  network congestion effectively.{' '}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);

const server = new McpServer({
  name: "BlockInfo MCP Agent",
  version: "1.0.0",
});

server.tool("getCurrentBlock", {}, async () => {
  try {
    const blockNumber = await provider.getBlockNumber();
    return {
      content: [
        {
          type: "text",
          text: `The current block number is: ${blockNumber}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
});

server.tool(
  "getBlockMiner",
  { blockNumber: z.string() },
  async ({ blockNumber }) => {
    try {
      const block = await provider.getBlock(Number(blockNumber));
      return {
        content: [
          {
            type: "text",
            text: `The miner of block ${blockNumber} is: ${block.miner}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// ✅ Updated to use provider.send instead of .getGasPrice()
server.tool("getGasPrice", {}, async () => {
  try {
    const gasPriceHex = await provider.send("eth_gasPrice", []);
    const gasPrice = BigInt(gasPriceHex);
    return {
      content: [
        {
          type: "text",
          text: `Current gas price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
});

server.tool(
  "getTransactionDetails",
  { txHash: z.string() },
  async ({ txHash }) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        return {
          content: [
            {
              type: "text",
              text: `Transaction not found for hash: ${txHash}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Transaction details:\nFrom: ${tx.from}\nTo: ${tx.to}\nValue: ${ethers.formatEther(tx.value)} ETH\nGas Price: ${ethers.formatUnits(tx.gasPrice!, "gwei")} Gwei`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getTransactionStatus",
  { txHash: z.string() },
  async ({ txHash }) => {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
      );
      const json = await response.json();

      if (json.status === "1" && json.result) {
        const status = json.result.status === "1" ? "Success" : "Fail";
        return {
          content: [
            {
              type: "text",
              text: `Transaction status for ${txHash} is: ${status}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Unable to fetch status or invalid transaction hash.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("✅ MCP Agent is running and ready for Claude!");

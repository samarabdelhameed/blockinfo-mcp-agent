import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);

const server = new McpServer({
  name: "BlockInfo MCP Agent",
  version: "1.0.0",
});

server.tool(
  "getCurrentBlock",
  {},
  async () => {
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
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getBlockMiner",
  { blockNumber: "number" },
  async ({ blockNumber }) => {
    try {
      const block = await provider.getBlock(blockNumber);
      return {
        content: [
          {
            type: "text",
            text: `The miner of block ${blockNumber} is: ${block.miner}`,
          },
        ],
      };
    } catch (error) {
const errorMessage = error instanceof Error ? error.message : 'error without message';
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getGasPrice",
  {},
  async () => {
    try {
      const gasPrice = await provider.getGasPrice();
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
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getTransactionDetails",
  { txHash: "string" },
  async ({ txHash }) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return {
        content: [
          {
            type: "text",
            text: `Transaction not found for hash: ${txHash}`,
          },
        ],
      };

      return {
        content: [
          {
            type: "text",
            text: `Transaction details:\nFrom: ${tx.from}\nTo: ${tx.to}\nValue: ${ethers.formatEther(tx.value)} ETH\nGas Fee: ${ethers.formatUnits(tx.gasPrice * tx.gasLimit, "gwei")} Gwei`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getTransactionStatus",
  { txHash: "string" },
  async ({ txHash }) => {
    try {
      const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
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
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("✅ MCP Agent is running and ready for Claude!");

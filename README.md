# Solana Tx and Instruction Parsing

git clone git@github.com:onezoomin/solana-tx-vue.git
yarn
yarn dev

## What does this repo do
1. Focuses on data structure and offline caching of historic blockchain data
2. Fetches historic transactions
3. parses, reorganizes and displays instructions
    including:
      - nesting inner instructions more logically and accessibly than the RPC results
      - decoding serum instructions
      
## What does this repo wish it could do
1. React better to result fetching ( now requires a refresh after the initial data fetching )
2. Provide a more robust and sophisticated throttling system to avoid RPC 429 too many requests
3. Deal with decimals in the newOrderV3 from serum 

# How to send SPL tokens on Solana using Javascript

For some reason, it's quite complex to send custom (non-SOL) tokens on Solana using Javascript. I spent a few days trying different solutions proposed on Stack Overflow and other random sites, but was unsuccessful until I found this solution.

Basically all the files you need are in the `transaction` folder. The main function is `onSendSPLTransaction` (inside SendTransaction.tsx) and you can see one way to use it in `index.js`

## Running the test repo

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Then open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

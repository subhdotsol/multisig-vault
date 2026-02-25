// steps for deposit :
// 1. Validate the deposit amount:
//    - Ensure deposit amount > 0.
// 2. Transfer SOL from the depositor to the Vault PDA using the System Program CPI.
// 3. Emit the DepositEvent.
// 4. Ensure the required accounts are provided:
//    - Depositor (Signer)
//    - Vault PDA
//    - System Program

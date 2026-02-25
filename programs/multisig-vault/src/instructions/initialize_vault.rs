// Steps for initialize vault :
// 1. Derive the Vault PDA using seeds: [b"vault", authority.key()].
// 2. Validate the input:
//    - Ensure threshold > 0.
//    - Ensure threshold ≤ number of owners.
//    - Ensure the owners list has no duplicates.
// 3. Initialize the Vault state:
//    - Store authority.
//    - Store owners list.
//    - Store threshold.
//    - Set proposal counter = 0.
//    - Store PDA bump.
// 4. Emit the VaultInitialized event.
// 5. Ensure the required accounts are provided:
//    - Initializer (Signer)
//    - Vault PDA (created)
//    - System Program

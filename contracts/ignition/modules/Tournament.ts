import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TournamentModule", (m) => {
  // Get the deployer account as the initial admin
  const deployer = m.getAccount(0);
  
  // Deploy or reference the SURR Token contract
  // If SURRToken is already deployed, you can reference it by address
  const surrToken = m.contract("SurrToken", []);
  
  // Deploy the Tournament contract with the SURR token address
  const tournament = m.contract("Tournament", [surrToken]);

  return { tournament, surrToken };
});

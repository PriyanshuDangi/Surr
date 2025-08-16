import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SURRTokenModule", (m) => {
  // Get the deployer account as the initial owner
  const deployer = m.getAccount(0);
  
  // Deploy the SURR Token contract with the deployer as the initial owner
  const surrToken = m.contract("SURRToken", [deployer]);

  return { surrToken };
});

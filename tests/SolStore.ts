import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolStore } from "../target/types/sol_store";

describe("SolStore", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolStore as Program<SolStore>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});

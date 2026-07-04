export type RepartoMetaLike = {
  contract_version?: string;
  reparto_contract_version?: string;
  service_version?: string;
};

const SUPPORTED_CONTRACTS = new Set(["reparto-docente-m8@0.1", "0.1"]);

export function assertRepartoCompatibility(meta: RepartoMetaLike): void {
  const contract = meta.reparto_contract_version ?? meta.contract_version;
  if (!contract || !SUPPORTED_CONTRACTS.has(contract)) {
    throw new Error(`Unsupported reparto-docente-m8 contract: ${contract ?? "unknown"}`);
  }
}

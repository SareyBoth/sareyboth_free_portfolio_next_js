import { importPortfolioJson } from "../scripts/import-portfolio";

async function main() {
  console.log("Seeding database from canonical portfolio.json...");
  const result = await importPortfolioJson();
  console.log(result.message);
  console.table(result.counts);
}

main().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});

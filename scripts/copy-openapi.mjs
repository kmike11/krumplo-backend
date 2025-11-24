import { cp, mkdir, rm, stat } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendRoot = resolve(__dirname, '..', '..', 'frontend');
const sourceDir = resolve(frontendRoot, '.openapi');
const targetDir = resolve(frontendRoot, 'src', 'api');

async function main() {
  try {
    await stat(sourceDir);
  } catch (error) {
    console.error(
      'No generated OpenAPI client found. Run "npm run openapi:client" first.',
    );
    process.exit(1);
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });

  console.log(`Copied OpenAPI client from ${sourceDir} to ${targetDir}`);
}

main().catch((error) => {
  console.error('Failed to copy OpenAPI client', error);
  process.exit(1);
});

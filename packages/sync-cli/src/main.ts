#!/usr/bin/env node
/**
 * longshelf: mirror a Calibre library to a Longshelf deployment (spec 003).
 *   longshelf library [--dry-run] [--yes] [--library <path>]
 *   longshelf config set <url|client-id|client-secret|library> <value>
 *   longshelf config show
 */
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { calibreLibraryPath } from './calibre.ts';
import { CONFIG_KEYS, configPath, loadConfig, mask, writeConfigValue } from './config.ts';
import { HashCache } from './hash-cache.ts';
import { runLibrary } from './library.ts';
import { EXIT, report, RunError } from './report.ts';
import { MirrorClient } from './upload.ts';

const USAGE = `Usage:
  longshelf library [--dry-run] [--yes] [--library <path>]
  longshelf config set <url|client-id|client-secret|library> <value>
  longshelf config show`;

async function confirm(question: string) {
	if (!process.stdin.isTTY) return false;
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return /^y(es)?$/i.test((await rl.question(question)).trim());
	} finally {
		rl.close();
	}
}

async function library(args: string[]) {
	const { values } = parseArgs({
		args,
		options: {
			'dry-run': { type: 'boolean' },
			yes: { type: 'boolean' },
			library: { type: 'string' }
		}
	});
	const config = loadConfig({ library: values.library });
	if (!config.url || !config.clientId || !config.clientSecret)
		throw new RunError(
			EXIT.notConfigured,
			'Not configured. Run: longshelf config set url <https://…>, then client-id and client-secret.'
		);
	const client = new MirrorClient({
		url: config.url,
		clientId: config.clientId,
		clientSecret: config.clientSecret
	});
	let run: Promise<string | null> | null = null;
	process.once('SIGINT', async () => {
		// The plan request may still be in flight: wait for its run id (a second Ctrl-C quits at
		// once), or the server takes the upload lock after we have gone and holds it for hours.
		const timeout = new Promise<null>((r) => setTimeout(() => r(null), 15_000).unref());
		const runId = run && (await Promise.race([run, timeout]));
		if (runId) await client.abort(runId).catch(() => {});
		console.error('\nStopped. Nothing half-done is shown in the mirror; run again to finish.');
		process.exit(130);
	});
	const summary = await runLibrary(
		{
			library: config.library ?? calibreLibraryPath(),
			client,
			cache: new HashCache(),
			dryRun: values['dry-run'],
			yes: values.yes,
			confirm,
			log: (line) => process.stderr.isTTY && process.stderr.write(`\r${line}   `),
			onRun: (id) => (run = id)
		},
		new URL(config.url).host
	);
	if (process.stderr.isTTY) process.stderr.write('\r');
	const { text, code } = report(summary);
	console.log(text);
	return code;
}

function config(args: string[]) {
	const [action, key, value] = args;
	if (action === 'show') {
		const c = loadConfig();
		console.log(`Config file: ${configPath()}`);
		console.log(`url:           ${c.url ?? '(not set)'}`);
		console.log(`client-id:     ${mask(c.clientId)}`);
		console.log(`client-secret: ${mask(c.clientSecret)}`);
		console.log(`library:       ${c.library ?? '(Calibre default)'}`);
		return EXIT.ok;
	}
	if (action === 'set' && key && value && key in CONFIG_KEYS) {
		writeConfigValue(CONFIG_KEYS[key as keyof typeof CONFIG_KEYS], value);
		console.log(`Saved ${key} to ${configPath()}`);
		return EXIT.ok;
	}
	console.error(USAGE);
	return EXIT.notConfigured;
}

async function main(argv: string[]): Promise<number> {
	const [command, ...rest] = argv;
	if (command === 'library') return library(rest);
	if (command === 'config') return config(rest);
	console.error(USAGE);
	return command ? EXIT.notConfigured : EXIT.ok;
}

main(process.argv.slice(2)).then(
	(code) => process.exit(code),
	(err: unknown) => {
		if (err instanceof RunError) {
			console.error(err.message);
			process.exit(err.code);
		}
		console.error(err instanceof Error ? err.message : String(err));
		process.exit(EXIT.problems);
	}
);

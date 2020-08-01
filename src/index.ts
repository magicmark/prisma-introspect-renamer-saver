import yargs from 'yargs';
import { promises as fsPromises } from 'fs';
import transform from './transform';

async function main() {
    const { write, prismaFile, transformsFile } = yargs
        .option('prismaFile', {
            alias: 'p',
            describe: 'path to a .prisma file',
            type: 'string',
            demandOption: true,
        })
        .option('transformsFile', {
            alias: 't',
            describe: 'path to a transforms file',
            type: 'string',
            demandOption: true,
        })
        .option('write', {
            alias: 'w',
            describe: 'write contents back to file? (prints to stdout if false)',
            type: 'boolean',
            default: false,
        })
        .strict()
        .help()
        .version(false).argv;

    const output = await transform(prismaFile, transformsFile);

    if (write) {
        await fsPromises.writeFile(prismaFile, output);
    } else {
        console.log(output);
    }
}

main();

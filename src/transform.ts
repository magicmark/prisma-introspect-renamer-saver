import assert from 'assert';
import { EOL } from 'os';
import { promises as fsPromises } from 'fs';
import yaml from 'js-yaml';
import util from 'util';
import { DeepReadonly } from 'utility-types';

interface Transforms {
    models: Array<{
        name: string;
        fields: Array<{
            field: string;
            attributes: {
                fieldName?: string;
            };
        }>;
    }>;
}

export default async function transform(
    prismaFilePath: string,
    transformsFilePath: string,
    shouldWrite: boolean,
): Promise<void> {
    assert(typeof prismaFilePath === 'string');
    assert(typeof transformsFilePath === 'string');

    const prismaFile = await fsPromises.readFile(prismaFilePath, 'utf-8');
    const transformsFile = await fsPromises.readFile(transformsFilePath, 'utf-8');
    const transforms = yaml.safeLoad(transformsFile) as DeepReadonly<Transforms>;

    // Set up up some state to read through the file
    const lines: Array<string> = [];
    let currentModel: string | null = null;

    prismaFile.split(EOL).forEach((line) => {
        function transformLine() {
            if (currentModel == null) {
                return line;
            } else {
                // Look up if the user specified any transforms for this model
                // TODO: pre-crunch this list and turn into an index
                const modelTransforms = transforms.models.find(({ name }) => name === currentModel);
                if (!modelTransforms) {
                    return line;
                }

                /**
                 * Extract the field name from the current line
                 * @example "  id                String              @id" -> "id"
                 */
                const currentField = line.match(/\s*(.+?)\s+/)?.[1]?.trim();
                if (!currentField) {
                    return line;
                }

                /**
                 * Look up if there are any transforms to apply to this field
                 */
                const fieldTransforms = modelTransforms.fields.find(({ field }) => field === currentField);
                if (!fieldTransforms) {
                    return line;
                }

                if (!fieldTransforms.attributes || !fieldTransforms.attributes.fieldName) {
                    return line;
                }

                return line.replace(currentField, fieldTransforms.attributes.fieldName);
            }
        }

        lines.push(transformLine());

        // We must be at the start of a new model stanza
        if (line.startsWith('model ')) {
            // Santity check. If it's a valid .prisma file, this should never occur.
            assert(
                currentModel == null,
                `Attempted to parse the start of a new model stanza - but we're already parsing model: "${util.inspect(
                    currentModel,
                )}". Is this a valid .prisma file?`,
            );

            const [, newModel] = line.match(/model (.+?) {/) as [void, string];

            assert(
                typeof newModel === 'string' && newModel.length > 0,
                'expected new model name to be a non-empty string',
            );
            currentModel = newModel.trim();
        }

        // We've reached the end of a stanza - model or otherwise.
        if (line.startsWith('}')) {
            currentModel = null;
        }
    });

    if (shouldWrite) {
        await fsPromises.writeFile(prismaFilePath, lines.join(EOL));
    } else {
        console.log(lines.join(EOL));
    }
}

import { RepopackConfigMerged } from '../config/configTypes.js';
import { SanitizedFile } from '../utils/fileHandler.js';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { generateTreeString } from '../utils/treeGenerator.js';

const PLAIN_SEPARATOR = '='.repeat(16);
const PLAIN_LONG_SEPARATOR = '='.repeat(64);

export async function generateOutput(
  rootDir: string,
  config: RepopackConfigMerged,
  sanitizedFiles: SanitizedFile[],
  allFilePaths: string[],
  fsModule = fs,
): Promise<void> {
  const commonData = generateCommonData(config, allFilePaths, sanitizedFiles);

  let output: string;
  if (config.output.style === 'xml') {
    output = generateXmlOutput(commonData);
  } else {
    output = generatePlainOutput(commonData);
  }

  const outputPath = path.resolve(rootDir, config.output.filePath);
  await fsModule.writeFile(outputPath, output);
}

interface CommonData {
  generationDate: string;
  treeString: string;
  sanitizedFiles: SanitizedFile[];
  config: RepopackConfigMerged;
}

export function generateCommonData(
  config: RepopackConfigMerged,
  allFilePaths: string[],
  sanitizedFiles: SanitizedFile[],
): CommonData {
  return {
    generationDate: new Date().toISOString(),
    treeString: generateTreeString(allFilePaths),
    sanitizedFiles,
    config,
  };
}

export function generatePlainOutput(data: CommonData): string {
  const { generationDate, treeString, sanitizedFiles, config } = data;

  let output = `${PLAIN_LONG_SEPARATOR}
Repopack Output File
${PLAIN_LONG_SEPARATOR}

This file was generated by Repopack on: ${generationDate}

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This header section
2. Repository structure
3. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
1. This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
2. When processing this file, use the separators and "File:" markers to
  distinguish between different files in the repository.
3. Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repopack's
  configuration.
- Binary files are not included in this packed representation. Please refer to
  the Repository Structure section for a complete list of file paths, including
  binary files.
${config.output.removeComments ? '- Code comments have been removed.\n' : ''}
${config.output.showLineNumbers ? '- Line numbers have been added to the beginning of each line.\n' : ''}

For more information about Repopack, visit: https://github.com/yamadashy/repopack

`;

  if (config.output.headerText) {
    output += `Additional User-Provided Header:
--------------------------------
${config.output.headerText}

`;
  }

  output += `${PLAIN_LONG_SEPARATOR}
Repository Structure
${PLAIN_LONG_SEPARATOR}
${treeString}

${PLAIN_LONG_SEPARATOR}
Repository Files
${PLAIN_LONG_SEPARATOR}

`;

  for (const file of sanitizedFiles) {
    output += `${PLAIN_SEPARATOR}
File: ${file.path}
${PLAIN_SEPARATOR}
${file.content}

`;
  }

  return output.trim() + '\n';
}

export function generateXmlOutput(data: CommonData): string {
  const { generationDate, treeString, sanitizedFiles, config } = data;

  let xml = `<summary>

<header>
Repopack Output File
This file was generated by Repopack on: ${generationDate}
</header>

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository structure
3. Repository files, each consisting of:
    - File path as an attribute
    - Full contents of the file
</file_format>

<usage_guidelines>
1. This file should be treated as read-only. Any changes should be made to the
    original repository files, not this packed version.
2. When processing this file, use the file path attributes to distinguish
    between different files in the repository.
3. Be aware that this file may contain sensitive information. Handle it with
    the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repopack's
  configuration.
- Binary files are not included in this packed representation.
${config.output.removeComments ? '- Code comments have been removed.\n' : ''}
${config.output.showLineNumbers ? '- Line numbers have been added to the beginning of each line.\n' : ''}
</notes>

<additional_info>
For more information about Repopack, visit: https://github.com/yamadashy/repopack
</additional_info>
`;

  if (config.output.headerText) {
    xml += `
<user_provided_header>
${config.output.headerText}
</user_provided_header>
`;
  }

  xml += `
</summary>

<repository_structure>
${treeString}
</repository_structure>

<repository_files>
`;

  for (const file of sanitizedFiles) {
    xml += `
<file path="${file.path}">
${file.content}
</file>
`;
  }

  xml += `
</repository_files>
`;

  return xml.trim() + '\n';
}

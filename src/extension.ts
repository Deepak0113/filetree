import { readdirSync, statSync, writeFileSync } from "fs";
import * as vscode from "vscode";

interface IndentMap {
	[x: string]: boolean[];
}

const generateIntent = (pattern: boolean[]) => {
	let indentString: string = "";

	pattern.forEach((item, ind) => {
		if(ind+1 === pattern.length){
			indentString += item ? "└── " : "│── ";
		} else{
			indentString += item ? "    " : "│   ";
		}
	});

	return indentString;
};

const generateFileTree = (mainFileName: string, url: string) => {
	const lines: string[] = [mainFileName];

	let stack = readdirSync(url).filter(e => e !== "FileStructure.txt");
	let visited: string[] = [];
	let lastList = [`${url}\\${stack[stack.length - 1]}`];

	let indentMap:IndentMap = {
		[url]: []
	};

	while (stack.length !== 0) {
		const dir = stack[0] || "";
		const prevDirUrl = visited.length === 0 ? `${url}` : `${url}\\${visited.join("\\")}`;
		const dirUrl = `${prevDirUrl}\\${dir}`;

		if (dir === visited[visited.length - 1]) {
			stack.shift();
			visited.pop();
		} else {
			const isLast = lastList.includes(dirUrl);
			const indentPattern:boolean[] = [...indentMap[prevDirUrl], isLast];
			lines.push(generateIntent(indentPattern) + dir);

			indentMap = {
				...indentMap,
				[dirUrl]: indentPattern
			};

			if (statSync(dirUrl).isFile()) {
				stack.shift();
			} else {
				visited.push(dir);
				let subdir = readdirSync(dirUrl);
				stack = [...subdir, ...stack];
				lastList.push(`${dirUrl}\\${subdir[subdir.length - 1]}`);
			}
		}
	}

	return lines.join("\n");
};

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand("filetree.generateFileTree", async () => {
			if (!vscode.workspace.workspaceFolders) {
				vscode.window.showInformationMessage("No folder or workspace opened");
			} else {
				const workspace = vscode.workspace.workspaceFolders[0];
				const workspaceName = workspace.name;
				const line = generateFileTree(workspaceName, workspace.uri.fsPath);
				writeFileSync(`${workspace.uri.fsPath}\\FileStructure.txt`, line);
			}
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }

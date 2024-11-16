import { describe, test, expect, beforeAll } from "vitest";
import { loadDataFromLoomDir, addToObjectRecursively } from "./load-data.js";
import { MemoryAdapter } from "@loom-io/in-memory-adapter";
import { dirname, basename} from "path";


const adapter = new MemoryAdapter();



describe("loadData", () => {


	test("load data from loom dir", async () => {
		/** create fake data */
		const directory = await adapter.dir("__data");
		await directory.create();

		const paths = ["nav.yml", "main/section/0.yml", "main/section/1.yml", "main/section/2.yml", "main/section/3.yml", "main/footer.yml"];
		const amount = paths.length;
		for(let i = 0; i < amount; i++) {
			const subDir = directory.subDir(dirname(paths[i]));
			await subDir.create();

			const file =  subDir.file(basename(paths[i]))
			await file.create();
			await file.write(`version: ${i}`)
		}

		const data = await loadDataFromLoomDir(directory);
		expect(data).toEqual({
			nav: {
				version: 0
			},
			main: {
				section: {
					0: {
						version: 1
					},
					1: {
						version: 2
					},
					2: {
						version: 3
					},
					3: {
						version: 4
					}
				},
				footer: {
					version: 5
				}
			}
		});
	});



	test("add to object recursively", () => {
		const object = {};
		const path = ["a", "b", "c"];
		const value = "value";
		addToObjectRecursively(path, object, value);
		expect(object).toEqual({
			a: {
				b: {
					c: "value"
				}
			}
		});
	});
});


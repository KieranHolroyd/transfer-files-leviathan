import fs from "fs/promises";
import path from "path";
import { Database, SQLQueryBindings } from "bun:sqlite";

export type FilesTree = Array<Array<Files | null> | void>;

export type Files = {
  path: string;
  name: string;
  size: number;
  files: Files[] | false;
  isDirectory: boolean;
};
export type ErrorRes = {
  error: string;
};

const db = new Database("file:./config/sqlite.db");

Bun.serve({
  fetch(req) {
    console.log(req);
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/":
        return new Response("hello, world!");
      case "/api/files":
        return handler(req);
      default:
        return new Response("404 Not Found", { status: 404 });
    }
  },
   
});

export default async function handler(req: Request) {
  const cache = await cached();
  if (cache) {
    const res = Response.json({
      files: cache.result,
      timestamp: Date.parse(cache.timestamp),
    });
    res.headers.set("Access-Control-Allow-Origin", "*");

    return res;
  }
  const systems = ["ROOT_PATH_LEVIATHAN_HDD", "ROOT_PATH_LEVIATHAN"].map(
    async (env) => {
      if (!process.env[env]) {
        return undefined;
      }
      const ROOT_DIR = process.env[env] as string;
      // List all the files in the directory
      const filesMap = await recursiveFileMap(ROOT_DIR);
      const data = (await Promise.allSettled(filesMap))

        .filter((file) => file !== null && file.status === "fulfilled")

        .map((file) => {
          if (file.status === "fulfilled") {
            return file.value;
          }
          return null;
        })
        .sort((a, b) => {
          if (a?.isDirectory && !b?.isDirectory) {
            return -1;
          }
          if (!a?.isDirectory && b?.isDirectory) {
            return 1;
          }
          return 0;
        });

      return data;
    }
  );

  if (!systems) {
  const res = Response.json({ error: "No Systems" });
  res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  }

  const data = await Promise.all(systems);

  await cache_files(data);

  const res = Response.json({ files: data, timestamp: Date.now() });
  res.headers.set("Access-Control-Allow-Origin", "*");
  
  return res;
}

async function recursiveFileMap(
  ROOT_DIR: string,
  recursive = false
): Promise<Promise<Files>[] | Files[]> {
  const files = await fs.readdir(ROOT_DIR);
  const filesMap = files.map(async (file) => {
    const fileStats = await fs.lstat(path.join(ROOT_DIR, file));
    const isDirectory = fileStats.isDirectory();
    return {
      path: path.join(ROOT_DIR, file),
      name: file,
      isDirectory,
      files: isDirectory
        ? await recursiveFileMap(path.join(ROOT_DIR, file), true)
        : false,
      size: fileStats.size,
    } as Files;
  });
  return recursive
    ? (await Promise.all(filesMap)).sort((a, b) => {
        if (a?.isDirectory && !b?.isDirectory) {
          return -1;
        }
        if (!a?.isDirectory && b?.isDirectory) {
          return 1;
        }
        return 0;
      })
    : filesMap;
}

async function cached(): Promise<
  { result: FilesTree; timestamp: string } | false
> {
  ensureDatabaseIsReady();
  const cached = db
    .query<FileCache, SQLQueryBindings>(
      "SELECT * FROM `file-cache` ORDER BY id DESC LIMIT 1"
    )
    .get({});
  if (cached !== null && !diff_date(cached.created_at)) {
    if (!cached.files || cached.files === "") {
      return false;
    }
    try {
      const c = JSON.parse(cached.files);
      c.timestamp = cached.created_at;
      return { result: c, timestamp: cached.created_at };
    } catch {
      return false;
    }
  }
  return false;
}

type FileCache = {
  id: number;
  files: string;
  created_at: string;
};

async function cache_files(data: FilesTree) {
  ensureDatabaseIsReady();
  const files = db
    .query<FileCache, SQLQueryBindings>(
      "SELECT * FROM `file-cache` ORDER BY id DESC LIMIT 1"
    )
    .get({});
  if (!files || (files?.created_at && diff_date(files.created_at))) {
    db.query("INSERT INTO `file-cache` (files) VALUES ($files)").run({
      $files: JSON.stringify(data),
    });
  }
}

async function ensureDatabaseIsReady() {
  const query = db.query(`CREATE TABLE IF NOT EXISTS \`file-cache\` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    files TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  return query.run();
}

function diff_date(date: string) {
  return Date.now() - Date.parse(date) > 3600000 + 60 * 1000;
}

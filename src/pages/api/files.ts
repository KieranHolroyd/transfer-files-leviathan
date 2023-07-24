// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilesTree | ErrorRes>
) {
  const cache = await cached();
  if (cache) {
    return res.json(cache);
  }
  const systems = ["ROOT_PATH_LEVIATHAN_HDD", "ROOT_PATH_LEVIATHAN"].map(
    async (env) => {
      if (!process.env[env]) {
        return res.status(500).json({ error: `${env} not set` });
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
  const data = await Promise.all(systems);

  await cache_files(data);

  return res.json(data);
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

async function cached(): Promise<FilesTree | false> {
  if (process.env.CACHE_DIR) {
    await ensureCacheFileExists();
    const cached = await fs.readFile(
      `${process.env.CACHE_DIR as string}/files.json`,
      {
        encoding: "utf-8",
      }
    );
    if (!cached || cached === "") {
      return false;
    }
    return JSON.parse(cached);
  }
  return false;
}

async function cache_files(data: FilesTree) {
  if (process.env.CACHE_DIR) {
    await ensureCacheFileExists();

    await fs.writeFile(
      `${process.env.CACHE_DIR as string}/files.json`,
      JSON.stringify(data)
    );
  }
}

async function ensureCacheFileExists() {
  const cache_file_exists = existsSync(
    `${process.env.CACHE_DIR as string}/files.json`
  );
  if (!cache_file_exists) {
    await fs.writeFile(`${process.env.CACHE_DIR as string}/files.json`, "");
  }
}

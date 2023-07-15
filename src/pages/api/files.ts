// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

export type Files = {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
};
export type ErrorRes = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Array<Array<Files | null> | void> | ErrorRes>
) {
  const systems = ["ROOT_PATH_LEVIATHAN_HDD", "ROOT_PATH_LEVIATHAN"].map(
    async (env) => {
      if (!process.env[env]) {
        return res.status(500).json({ error: `${env} not set` });
      }
      const ROOT_DIR = process.env[env] as string;
      // List all the files in the directory
      const files = await fs.readdir(ROOT_DIR);
      const filesMap = files.map(async (file) => {
        const fileStats = await fs.lstat(path.join(ROOT_DIR, file));
        return {
          path: path.join(ROOT_DIR, file),
          name: file,
          isDirectory: fileStats.isDirectory(),
          size: fileStats.size,
        };
      });
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
        })
        .map((file) => {
          if (file) {
            return {
              path: file.path,
              name: file.name,
              size: file.size,
              isDirectory: file.isDirectory,
            };
          }
          return null;
        });

      return data;
    }
  );
  const data = await Promise.all(systems);

  return res.json(data);
}

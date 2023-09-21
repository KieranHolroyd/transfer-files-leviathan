//// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
//import type { NextApiRequest, NextApiResponse } from "next";
//import fs from "fs/promises";
//import path from "path";
//import { existsSync } from "fs";
//const {Database, SQLQueryBindings} =  require("bun:sqlite")
//
//export type FilesTree = Array<Array<Files | null> | void>;
//
//export type Files = {
//  path: string;
//  name: string;
//  size: number;
//  files: Files[] | false;
//  isDirectory: boolean;
//};
//export type ErrorRes = {
//  error: string;
//};
//
//const db = new Database("file:./config/sqlite.db")
//
//export default async function handler(
//  req: NextApiRequest,
//  res: NextApiResponse<FilesTree | ErrorRes>
//) {
//  const cache = await cached();
//  if (cache) {
//    return res.json(cache);
//  }
//  const systems = ["ROOT_PATH_LEVIATHAN_HDD", "ROOT_PATH_LEVIATHAN"].map(
//    async (env) => {
//      if (!process.env[env]) {
//        return res.status(500).json({ error: `${env} not set` });
//      }
//      const ROOT_DIR = process.env[env] as string;
//      // List all the files in the directory
//      const filesMap = await recursiveFileMap(ROOT_DIR);
//      const data = (await Promise.allSettled(filesMap))
//
//        .filter((file) => file !== null && file.status === "fulfilled")
//
//        .map((file) => {
//          if (file.status === "fulfilled") {
//            return file.value;
//          }
//          return null;
//        })
//        .sort((a, b) => {
//          if (a?.isDirectory && !b?.isDirectory) {
//            return -1;
//          }
//          if (!a?.isDirectory && b?.isDirectory) {
//            return 1;
//          }
//          return 0;
//        });
//
//      return data;
//    }
//  );
//  const data = await Promise.all(systems);
//
//  await cache_files(data);
//
//  return res.json(data);
//}
//
//async function recursiveFileMap(
//  ROOT_DIR: string,
//  recursive = false
//): Promise<Promise<Files>[] | Files[]> {
//  const files = await fs.readdir(ROOT_DIR);
//  const filesMap = files.map(async (file) => {
//    const fileStats = await fs.lstat(path.join(ROOT_DIR, file));
//    const isDirectory = fileStats.isDirectory();
//    return {
//      path: path.join(ROOT_DIR, file),
//      name: file,
//      isDirectory,
//      files: isDirectory
//        ? await recursiveFileMap(path.join(ROOT_DIR, file), true)
//        : false,
//      size: fileStats.size,
//    } as Files;
//  });
//  return recursive
//    ? (await Promise.all(filesMap)).sort((a, b) => {
//        if (a?.isDirectory && !b?.isDirectory) {
//          return -1;
//        }
//        if (!a?.isDirectory && b?.isDirectory) {
//          return 1;
//        }
//        return 0;
//      })
//    : filesMap;
//}
//
//async function cached(): Promise<FilesTree | false> {
//    ensureDatabaseIsReady();
//    const cached = db.query<FileCache, SQLQueryBindings>("SELECT * FROM `file-cache` ORDER BY 'created_at' DESC").get({});
//    if(cached !== null) {
//
//      if (!cached.files || cached.files === "") {
//        return false;
//      }
//      try {
//        return JSON.parse(cached.files);
//      } catch {
//        return false;
//      }
//    } 
//    return false;
//}
//
//type FileCache = {
//  id: number,
//  files: string,
//  created_at: string
//}
//
//async function cache_files(data: FilesTree) {
//  ensureDatabaseIsReady();
//  const files = db.query<FileCache, SQLQueryBindings>("SELECT * FROM `file-cache` ORDER BY 'created_at' DESC").get({});
//  if(files?.created_at && Date.now() - Date.parse(files?.created_at) > 60 * 1000) {
//    console.log(data);
//    db.query("INSERT INTO `file-cache` (files) VALUES ($files)").run({
//      $files: JSON.stringify(data)
//    })
//  }
//}
//
//async function ensureDatabaseIsReady() {
//  const query = db.query(`CREATE TABLE IF NOT EXISTS \`file-cache\` (
//    id INT AUTO_INCREMENT PRIMARY KEY,
//    files TEXT,
//    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//  )`);
//
//  return query.run();
//}

import Image from "next/image";
import { Foldit, Inter } from "next/font/google";
import { Fragment, useEffect, useState } from "react";
import { Files } from "./api/files";
import apiClient from "@/lib/axios";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [error, setError] = useState<Error | null>(null);
  const [files, setFiles] = useState<Array<Array<Files | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/files")
      .then((res) => {
        if (res.status !== 200) {
          setError(new Error(res.data));
          return console.error(res.data);
        }
        setLoading(false);
        setFiles(res.data);
      })
      .catch((err) => {
        setError(new Error(err));
      });

  }, []);

  // async function l_openFolder(path: string) {
  //   apiClient
  //     .get(`/folder`, {
  //       params: {
  //         path,
  //       },
  //     })
  //     .then((res) => {
  //       if (res.status !== 200) {
  //         setError(new Error(res.data));
  //         return console.error(res.data);
  //       }
  //       setFiles([files[0], res.data]);
  //     });
  // }

  // async function lhdd_openFolder(path: string) {
  //   apiClient
  //     .get(`/folder`, {
  //       params: {
  //         hdd: true,
  //         path,
  //       },
  //     })
  //     .then((res) => {
  //       if (res.status !== 200) {
  //         setError(new Error(res.data));
  //         return console.error(res.data);
  //       }
  //       setFiles([res.data, files[1]]);
  //     });
  // }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-12 ${inter.className}`}
    >
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Leviathan Backup HDD -&gt; Leviathan [File Transfer]
        </p>
      </div>
      <div className="grid grid-cols-2 space-x-2 relative z-0 w-full max-w-5xl justify-between font-mono text-sm">
        {!error ? (
          <Fragment>
            <div className="max-h-[50vh] overflow-y-auto border-2 rounded border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30">
              <h1 className="bg-zinc-800/70 px-4 py-2 select-none">
                Leviathan
              </h1>
              <table className="w-full">
                <TableHead />
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={3}>Loading...</td>
                    </tr>
                  )}
                  {!loading && <FileTree files={files[1]} />}
                </tbody>
              </table>
            </div>
            <div className="max-h-[50vh] overflow-y-auto border-2 rounded border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30">
              <h1 className="bg-zinc-800/70 px-4 py-2 select-none">
                Leviathan HDD
              </h1>
              <table className="w-full">
                <TableHead />
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={3}>Loading...</td>
                    </tr>
                  )}
                  {!loading && <FileTree files={files[0]} />}
                </tbody>
              </table>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <div className="border-2 rounded p-2 border-b border-red-300 bg-gradient-to-b from-orange-200 pb-6 pt-8 backdrop-blur-2xl dark:border-red-800 dark:bg-red-800/30 dark:from-inherit lg:static lg:w-auto col-span-2 lg:rounded-xl lg:border lg:bg-red-200 lg:p-4 lg:dark:bg-red-800/30">
              <p className="text-center">{error.message}</p>
              {error.stack && (
                <details className="text-center">
                  <summary className="font-bold">Stack Trace</summary>
                  <pre className="text-left overflow-x-hidden text-ellipsis">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </Fragment>
        )}
      </div>
    </main>
  );
}

function TableHead() {
  return (
    <thead className="sticky top-0 bg-zinc-800/70 select-none">
      <tr>
        <th className="text-left px-4 py-3">Name</th>
        <th className="text-left px-4 py-3">Size</th>
        <th className="text-left px-4 py-3">Path</th>
      </tr>
    </thead>
  );
}

export function FileTree({ files }: { files: Array<Files | null> }) {
  return (
    <Fragment>
      {files.map((file) => file && <FileRow key={file.path} file={file} />)}
    </Fragment>
  );
}

export function FileRow({ file }: { file: Files }) {
  const [visible, setVisible] = useState(false);

  return (
    <Fragment>
      <tr
        key={file.path}
        className="hover:bg-zinc-600/30 transition-colors"
        onClick={() => setVisible(!visible)}
      >
        <td className="px-4 py-2">{file.name}</td>
        <td className="px-4 py-2">
          {!file.isDirectory ? (
            <>{(file.size / 1024 / 1024).toFixed(3)} MB</>
          ) : (
            <>Folder</>
          )}
        </td>
        <td className="px-4 py-2">
          {file.path?.length > 52
            ? `${file.path.slice(0, 12)}...${file.path.slice(
                file.path.length - 36
              )}`
            : file.path}
        </td>
      </tr>
      {file.isDirectory && (
        <tr>
          <td colSpan={3} className="p-0">
            <table className={`${visible ? "ml-4" : "hidden"}`}>
              <TableHead />
              <tbody>
                {file.files &&
                  file.files.map((file) => (
                    <FileRow key={file.path} file={file} />
                  ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

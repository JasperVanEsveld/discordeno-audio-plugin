import { type } from "node:os";
import { exists } from "jsr:@std/fs/exists";
import { youtubeSearch } from "../../deps.ts";

const os = type() as keyof typeof binaries;
const binaries = {
    "Windows_NT":
        "https://github.com/yt-dlp/yt-dlp/releases/download/2025.06.09/yt-dlp.exe",
    "Linux":
        "https://github.com/yt-dlp/yt-dlp/releases/download/2025.06.09/yt-dlp_linux",
    "Darwin":
        "https://github.com/yt-dlp/yt-dlp/releases/download/2025.06.09/yt-dlp_macos",
};
const url = binaries[os];
const filename = `./${url.split("/").pop()}`;

if (!await exists(filename)) {
    const binaryResponse = await fetch(url);

    if (binaryResponse.body) {
        const file = await Deno.open(filename, {
            write: true,
            create: true,
        });

        await binaryResponse.body.pipeTo(file.writable);
    }
}
export async function getVideoInfo(search: string) {
    const video_info = (await youtubeSearch(search)).videos[0];
    if (video_info === undefined) {
        return undefined;
    }

    return {
        title: video_info.title as string,
        id: video_info.videoId as string,
    };
}

export function getAudioStream(id: string) {
    const cmd = new Deno.Command(filename, {
        args: [
            "-x",
            "--audio-format",
            "opus",
            "-o",
            "-",
            id,
        ],
        stdout: "piped",
        stderr: "null",
    });
    const child = cmd.spawn();

    return child.stdout;
}

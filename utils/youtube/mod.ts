import { type } from "node:os";
import { exists } from "jsr:@std/fs/exists";
import { youtubeSearch } from "../../deps.ts";

const os = type() as keyof typeof ytdlp_binaries;
const ytdlp_binaries = {
    Windows_NT: "https://github.com/yt-dlp/yt-dlp/releases/download/2025.11.12/yt-dlp.exe",
    Linux: "https://github.com/yt-dlp/yt-dlp/releases/download/2025.11.12/yt-dlp_linux",
};

async function download_binary(binaries: any) {
    const url = binaries[os];
    let filename = `./${url.split("/").pop()}`;
    if (!filename.endsWith(".exe")) {
        filename += ".exe";
    }

    if (!(await exists(filename))) {
        const binaryResponse = await fetch(url);

        if (binaryResponse.body) {
            const file = await Deno.open(filename, {
                write: true,
                create: true,
            });

            await binaryResponse.body.pipeTo(file.writable);
        }
    }
    return filename;
}
const ytdlp = await download_binary(ytdlp_binaries);

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

export async function getAudioStream(id: string) {
    const ytdlp_cmd = new Deno.Command(ytdlp, {
        args: ["-x", "--audio-format", "m4a", "-o", "./temp.m4a", id],
        stdin: "null",
        stdout: "null",
        stderr: "null",
    });

    const ytdlp_child = ytdlp_cmd.spawn();
    await ytdlp_child.output();

    const ffmpeg_cmd = new Deno.Command("ffmpeg", {
        args: ["-i", "./temp.m4a", "-acodec", "pcm_s16le", "-f", "s16le", "-"],
        stdin: "null",
        stdout: "piped",
        stderr: "null",
    });

    const ffmpeg_child = ffmpeg_cmd.spawn();
    ffmpeg_child.status.then(async () => {
        await Deno.remove("./temp.m4a");
    });
    return ffmpeg_child.stdout;
}

export function getVideoStream(id: string) {
    const cmd = new Deno.Command(ytdlp, {
        args: ["-o", "-", id],
        stdout: "piped",
        stderr: "null",
    });
    const child = cmd.spawn();

    return child.stdout;
}

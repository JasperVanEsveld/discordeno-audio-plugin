import { ClientType } from "https://deno.land/x/youtubei@v13.3.0-deno/deno.ts";
import { BG, JSDOM, YT } from "../deps.ts";

export async function createInnerTubeClient() {
    const visitorData = YT.ProtoUtils.encodeVisitorData(
        YT.Utils.generateRandomString(11),
        Math.floor(Date.now() / 1000),
    );
    const po_token = await getPo(visitorData);
    return await YT.Innertube.create({
        po_token: po_token,
        visitor_data: visitorData,
        cache: new YT.UniversalCache(false),
        generate_session_locally: false,
        client_type: ClientType.WEB_EMBEDDED,
    });
}

async function getPo(identifier: string): Promise<string | undefined> {
    const requestKey = "O43z0dpjhgX20SCx4KAo";

    const dom = new JSDOM();

    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document,
    });

    const bgConfig = {
        fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
            fetch(input, init),
        globalObj: globalThis,
        requestKey,
        identifier,
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);

    if (!bgChallenge) {
        throw new Error("Could not get challenge");
    }

    const interpreterJavascript = bgChallenge.interpreterJavascript
        .privateDoNotAccessOrElseSafeScriptWrappedValue;

    if (interpreterJavascript) {
        new Function(interpreterJavascript)();
    } else throw new Error("Could not load VM");

    const poTokenResult = await BG.PoToken.generate({
        program: bgChallenge.program,
        globalName: bgChallenge.globalName,
        bgConfig,
    });

    return poTokenResult.poToken;
}

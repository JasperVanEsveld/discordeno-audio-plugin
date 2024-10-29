import {
    BG,
    type BgConfig,
    Innertube,
    JSDOM,
    UniversalCache,
} from "../deps.ts";

export async function createInnerTubeClient() {
    const innertube = await Innertube.create({ retrieve_player: false });

    const requestKey = "O43z0dpjhgX20SCx4KAo";
    const visitorData = innertube.session.context.client.visitorData;

    if (!visitorData) throw new Error("Could not get visitor data");

    const dom = new JSDOM();

    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document,
    });

    const bgConfig: BgConfig = {
        fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
            fetch(input, init),
        globalObj: globalThis,
        identifier: visitorData,
        requestKey,
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);

    if (!bgChallenge) throw new Error("Could not get challenge");

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

    return await Innertube.create({
        po_token: poTokenResult.poToken,
        visitor_data: visitorData,
        cache: new UniversalCache(false),
        generate_session_locally: true,
    });
}

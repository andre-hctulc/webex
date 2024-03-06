// Currently the build has to be imported, because .js extension fot ts imports can not be resolved
import Provider, { Extension } from "../../index";
import type ProviderInterface from "../../test-extension/src/ProviderInterface.js";
import type { Out as ModuleInterface } from "../../test-extension/src/modules/math.js";
import type { Out as ComponentInterface } from "../../test-extension/src/frames/counter/index.js";

main().catch(err => console.error(err));

const providerApi: ProviderInterface = {
    echo: text => {
        text = text || "";
        return text + "  " + text + "  " + text;
    },
    alert: message => {
        alert(message || "<empty>");
    },
    print: (...text) => {
        const container = document.getElementById("print");
        if (container) console.log("Print:", (text || ["<empty>"]).join(" "));
    },
    greet: (name, age) => {
        alert("Hello " + name + " AGE " + age);
    },
};

async function launchIFrames(extension: Extension) {
    // iframe

    const container = document.getElementById("iframe");
    const container2 = document.getElementById("iframe2");
    const resetBtn = document.getElementById("reset");

    if (container && container2 && resetBtn) {
        const componentModule = await extension.launchComponent<ProviderInterface, ComponentInterface>(
            container,
            "dist/frames/counter/index.html",
            providerApi
        );

        const componentModule2 = await extension.launchComponent<ProviderInterface, ComponentInterface>(
            container2,
            "dist/frames/counter/index.html",
            providerApi
        );

        setInterval(async () => {
            const newCounter = await componentModule.execute("increment");
            await componentModule2.execute("increment");
            console.log(`New counter <${newCounter}> returned by 'increment' execute (Should also be displayed in the iframe)`);
        }, 7000);

        resetBtn.onclick = () => {
            componentModule.execute("reset");
        };
    }
}

async function launchModule(extension: Extension) {
    const module = await extension.launchModule<ProviderInterface, ModuleInterface>("dist/math.js", providerApi);

    console.log("Module loaded:", extension);

    // module operations

    const operationBtn = document.getElementById("operation");

    if (operationBtn) {
        operationBtn.onclick = async () => {
            if (!module) return alert("Module not loaded");
            const sum = await module.execute("add", 1, 5);
            const d = await module.execute("substract", 10, 2);
            alert("Sum: " + sum + " Sub: " + d);
        };
    }
}

// https://cdn.jsdelivr.net/npm/extensionrunner/worker.js
async function main() {
    addEventListener("message", e => {
        console.log("Message received ::", e.data);
    });

    const prov = new Provider({ logs: true });
    const commitSha = "54497e57bb8de7cd65222c2fb596d6f704c094c0";
    const extension = await prov.loadExtension({
        type: "github",
        name: "andre-hctulc/extensionrunner-test-extension",
        version: commitSha,
    });

    console.log("Extension loaded:", extension);

    const info = document.getElementById("info");
    if (info) info.innerHTML = `${extension.pkg.name}@${extension.pkg.version} SHA ${commitSha}`;

    // pushState

    const stateBtn = document.getElementById("state");

    let counter = 0;

    // stateBtn.onclick = () => {
    //     extension.pushState({ message: "Counter: " + ++counter });
    // };

    // launch

    //launchModule(extension).catch(err => console.error("Error launching module", err));
    launchIFrames(extension).catch(err => console.error("Error launching iframe", err));
}

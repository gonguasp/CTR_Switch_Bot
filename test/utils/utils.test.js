require("module-alias/register");

const assert = require("assert");
const utils = require('@utils/utils.js');


describe("Utils", () => {
    it("read all commands", () => {
        let client = {};
        utils.readCommands(client);
        assert.notStrictEqual(client.commands, undefined);
    });
    it("are all items used? and restart usability", () => {
        let array = [
            { used: true },
            { used: true },
            { used: true }
        ];
        assert.strictEqual(utils.areAllUsed(array), true);
        utils.restartUsability(array);
        assert.strictEqual(utils.areAllUsed(array), false);
    });
    it("get welcome memes", () => {
        assert(utils.getWelcomeMemes().length > 0);
    });
    it("checks if emote is country flag", () => {
        assert.strictEqual(utils.isCountryFlag("🇻🇦"), true);
        assert.strictEqual(utils.isCountryFlag("✅"), false);
    });
    it("generates UUID", () => {
        assert.notStrictEqual(utils.generateUUID(), "");
    });
});



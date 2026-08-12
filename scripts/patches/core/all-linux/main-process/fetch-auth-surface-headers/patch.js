const { mainBundlePatch } = require("../../../../descriptor.js");
const {
	applyLinuxFetchAuthSurfaceHeadersPatch,
} = require("../../../../impl/main-process/network.js");

module.exports = mainBundlePatch({
	id: "linux-fetch-auth-surface-headers",
	phase: "main-bundle",
	order: 176,
	ciPolicy: "optional",
	apply: applyLinuxFetchAuthSurfaceHeadersPatch,
});
